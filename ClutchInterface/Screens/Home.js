import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { addFavorite, fetchHomeData, fetchSearchData } from '../services/homeService';

const backgroundImage = require('../assets/Fondo_Cancha.png');
const appLogo = require('../assets/LogoClutch.png');

function buildFavoritesSections(teams, players) {
  const sections = [];

  teams.forEach((team) => {
    sections.push({
      type: 'team',
      id: `team-${team.id}`,
      team,
    });

    players
      .filter((player) => player.teamId === team.id)
      .forEach((player) => {
        sections.push({
          type: 'player',
          id: `player-${player.id}`,
          player,
        });
      });
  });

  players
    .filter((player) => !player.teamId || !teams.some((team) => team.id === player.teamId))
    .forEach((player) => {
      sections.push({
        type: 'player',
        id: `player-${player.id}`,
        player,
      });
    });

  return sections;
}

function TeamLogo({ uri }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.shield} />;
  }

  return <Image source={appLogo} style={styles.shield} />;
}

const getPlayerFullName = (player) =>
  [player?.nombre, player?.primerApellido, player?.segundoApellido].filter(Boolean).join(' ');

export default function HomeScreen({ user, onGoProfile, onGoTeamDetail, onGoPlayerDetail }) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [liveMatches, setLiveMatches] = useState([]);
  const [followedTeams, setFollowedTeams] = useState([]);
  const [followedPlayers, setFollowedPlayers] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [teamSearchResults, setTeamSearchResults] = useState([]);
  const [playerSearchResults, setPlayerSearchResults] = useState([]);
  const searchInputRef = useRef(null);
  const latestSearchRequestRef = useRef(0);

  const userId = user?.id;

  useEffect(() => {
    let mounted = true;

    const loadHome = async () => {
      if (!userId) {
        setErrorMessage('No se pudo identificar el usuario para cargar sus favoritos.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const homeData = await fetchHomeData(userId);

        if (!mounted) {
          return;
        }

        setLiveMatches(homeData.liveMatches);
        setFollowedTeams(homeData.followedTeams);
        setFollowedPlayers(homeData.followedPlayers);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setErrorMessage('No se pudieron cargar los datos de la pantalla principal.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadHome();

    return () => {
      mounted = false;
    };
  }, [userId, reloadKey]);

  const favoritesSections = useMemo(
    () => buildFavoritesSections(followedTeams, followedPlayers),
    [followedTeams, followedPlayers]
  );

  const teamNamesById = useMemo(
    () => new Map(followedTeams.map((team) => [team.id, team.nombreEquipo])),
    [followedTeams]
  );

  const onSearch = useCallback(async (value) => {
    if (!userId) {
      return;
    }

    const query = typeof value === 'string' ? value : searchText;
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setTeamSearchResults([]);
      setPlayerSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    const requestId = latestSearchRequestRef.current + 1;
    latestSearchRequestRef.current = requestId;

    try {
      const data = await fetchSearchData(userId, normalizedQuery);
      if (latestSearchRequestRef.current !== requestId) {
        return;
      }
      setTeamSearchResults(data.teamResults);
      setPlayerSearchResults(data.playerResults);
    } catch (error) {
      if (latestSearchRequestRef.current !== requestId) {
        return;
      }
      setSearchError('No se pudo realizar la búsqueda.');
    } finally {
      if (latestSearchRequestRef.current === requestId) {
        setSearchLoading(false);
      }
    }
  }, [searchText, userId]);

  useEffect(() => {
    if (!isSearchOverlayOpen) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      onSearch(searchText);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchText, isSearchOverlayOpen, onSearch]);

  const openSearchOverlay = () => {
    setIsSearchOverlayOpen(true);
    setSearchError('');

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const closeSearchOverlay = () => {
    latestSearchRequestRef.current += 1;
    setIsSearchOverlayOpen(false);
    setSearchLoading(false);
    setSearchError('');
    setSearchText('');
    setTeamSearchResults([]);
    setPlayerSearchResults([]);
    Keyboard.dismiss();
  };

  const hasSearchResults = teamSearchResults.length > 0 || playerSearchResults.length > 0;

  const onAddFavorite = async (item) => {
    if (item.isFavorite) {
      return;
    }

    const payload =
      item.type === 'team'
        ? { usuarioId: userId, equipoId: item.id, jugadorId: null }
        : { usuarioId: userId, equipoId: null, jugadorId: item.id };

    const response = await addFavorite(payload);

    if (!response.ok) {
      setSearchError('No se pudo añadir a favoritos.');
      return;
    }

    setReloadKey((prev) => prev + 1);
    setTeamSearchResults((prev) =>
      prev.map((entry) => (entry.type === item.type && entry.id === item.id ? { ...entry, isFavorite: true } : entry))
    );
    setPlayerSearchResults((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, isFavorite: true } : entry))
    );
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerLeft} onPress={onGoProfile}>
            <Image source={appLogo} style={styles.appLogo} />
            <Text style={styles.userName}>{user?.apodo || 'Usuario'}</Text>
          </Pressable>
          <Pressable style={styles.searchButton} onPress={openSearchOverlay}>
            <Text style={styles.searchIcon}>🔍</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerMessageBox}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.helperText}>Cargando tu inicio...</Text>
          </View>
        ) : null}

        {!loading && errorMessage ? (
          <View style={styles.centerMessageBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable style={styles.retryButton} onPress={() => setReloadKey((prev) => prev + 1)}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !errorMessage ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Partidos en directo</Text>
            </View>

            {liveMatches.length === 0 ? (
              <Text style={styles.emptyText}>No hay partidos en directo de tus equipos seguidos.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveMatchesRow}>
                {liveMatches.map((match) => (
                  <View key={match.id} style={styles.liveCard}>
                    <Text style={styles.liveBadge}>● LIVE</Text>
                    <View style={styles.teamRow}>
                      <View style={styles.teamColumn}>
                        <TeamLogo uri={match.equipoLocal?.urlEscudo} />
                        <Text style={styles.teamAbbr} numberOfLines={2} ellipsizeMode="tail">
                          {match.equipoLocal?.nombreEquipo || 'Local'}
                        </Text>
                      </View>

                      <View style={styles.scoreColumn}>
                        <Text style={styles.scoreText}>{match.puntosLocal} - {match.puntosVisitante}</Text>
                      </View>

                      <View style={styles.teamColumn}>
                        <TeamLogo uri={match.equipoVisitante?.urlEscudo} />
                        <Text style={styles.teamAbbr} numberOfLines={2} ellipsizeMode="tail">
                          {match.equipoVisitante?.nombreEquipo || 'Visitante'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Equipos favoritos</Text>
            </View>

            {favoritesSections.map((item) => {
              if (item.type === 'team') {
                return (
                  <Pressable
                    key={item.id}
                    style={styles.favoriteCard}
                    onPress={() => onGoTeamDetail?.(item.team.id)}
                  >
                    <View style={styles.favoriteTop}>
                      <TeamLogo uri={item.team.shieldUrl} />
                      <View style={styles.favoriteInfo}>
                        <Text style={styles.favoriteName}>{item.team.nombreEquipo}</Text>
                        <Text style={styles.favoriteEnrollment}>
                          {item.team.inscripcionEquipo || `${item.team.division || '-'} · ${item.team.grupo || '-'}`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statsGrid}>
                      <View style={styles.statsGridHeader}>
                        <Text style={styles.statsHeaderText}>PJ</Text>
                        <Text style={styles.statsHeaderText}>PG</Text>
                        <Text style={styles.statsHeaderText}>PP</Text>
                        <Text style={styles.statsHeaderText}>PPP</Text>
                        <Text style={styles.statsHeaderText}>PCPPP</Text>
                      </View>
                      <View style={styles.statsGridValues}>
                        <Text style={styles.statsValueText}>
                          {(item.team.partidosGanados || 0) + (item.team.partidosPerdidos || 0)}
                        </Text>
                        <Text style={styles.statsDivider}>|</Text>
                        <Text style={styles.statsValueText}>{item.team.partidosGanados || 0}</Text>
                        <Text style={styles.statsDivider}>|</Text>
                        <Text style={styles.statsValueText}>{item.team.partidosPerdidos || 0}</Text>
                        <Text style={styles.statsDivider}>|</Text>
                        <Text style={styles.statsValueText}>{item.team.puntosAFavor || 0}</Text>
                        <Text style={styles.statsDivider}>|</Text>
                        <Text style={styles.statsValueText}>{item.team.puntosEnContra || 0}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={item.id}
                  style={styles.playerCard}
                  onPress={() => onGoPlayerDetail?.(item.player.id)}
                >
                  <View style={styles.playerTop}>
                    <Image
                      source={item.player.photoUrl ? { uri: item.player.photoUrl } : appLogo}
                      style={styles.playerPhoto}
                    />
                    <View style={styles.playerIdentity}>
                      <Text style={styles.playerName}>{getPlayerFullName(item.player) || 'Jugador'}</Text>
                      <Text style={styles.playerCategory}>{teamNamesById.get(item.player.teamId) || 'Sin equipo'}</Text>
                    </View>
                  </View>
                  <View style={styles.playerStatsRow}>
                    <View style={styles.playerStatsColumn}>
                      <Text style={styles.playerStatsLabel}>PJ</Text>
                      <Text style={styles.playerStatsLabel}>MPP</Text>
                      <Text style={styles.playerStatsLabel}>PPP</Text>
                    </View>
                    <View style={styles.playerStatsColumn}>
                      <Text style={styles.playerStatsValue}>{item.player.partidosJugados || 0}</Text>
                      <Text style={styles.playerStatsValue}>{item.player.minutosPorPartido || 0}</Text>
                      <Text style={styles.playerStatsValue}>{item.player.puntosPorPartido || 0}</Text>
                    </View>
                    <View style={styles.playerVerticalDivider} />
                    <View style={styles.playerLastMatch}>
                      <Text style={styles.playerLastMatchTitle}>Último Partido</Text>
                      <View style={styles.playerLastMatchStats}>
                        <View style={styles.playerStatsColumn}>
                          <Text style={styles.playerStatsLabel}>MIN</Text>
                          <Text style={styles.playerStatsValue}>{item.player.ultimoPartidoMinutos || 0}</Text>
                        </View>
                        <View style={styles.playerVerticalDivider} />
                        <View style={styles.playerStatsColumn}>
                          <Text style={styles.playerStatsLabel}>PTS</Text>
                          <Text style={styles.playerStatsValue}>{item.player.ultimoPartidoPuntos || 0}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {isSearchOverlayOpen ? (
          <View style={styles.overlayRoot}>
            <Pressable style={styles.overlayBackdrop} onPress={closeSearchOverlay} />
            <View style={styles.overlayPanel}>
              <View style={styles.overlayHeader}>
                <Text style={styles.overlayTitle}>Buscar</Text>
                <Pressable onPress={closeSearchOverlay}>
                  <Text style={styles.overlayClose}>✕</Text>
                </Pressable>
              </View>
              <View style={styles.searchRow}>
                <TextInput
                  ref={searchInputRef}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Buscar equipo o jugador"
                  placeholderTextColor="#8ea4c0"
                  style={styles.searchInput}
                  onSubmitEditing={() => onSearch(searchText)}
                  returnKeyType="search"
                  autoFocus
                />
              </View>

              <ScrollView style={styles.overlayResults} keyboardShouldPersistTaps="handled">
                {!searchText.trim() ? (
                  <Text style={styles.emptyText}>Escribe para ver resultados.</Text>
                ) : null}
                {searchLoading ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                {searchError ? <Text style={styles.emptyText}>{searchError}</Text> : null}
                {!searchLoading && !searchError && searchText.trim() && !hasSearchResults ? (
                  <Text style={styles.emptyText}>No se encontraron resultados.</Text>
                ) : null}

                {teamSearchResults.map((team) => (
                  <Pressable
                    key={team.key}
                    style={styles.searchCard}
                    onPress={() => {
                      closeSearchOverlay();
                      onGoTeamDetail?.(team.id);
                    }}
                  >
                    <View style={styles.searchMainInfo}>
                      <TeamLogo uri={team.logoUrl} />
                      <View style={styles.searchTextWrap}>
                        <Text style={styles.favoriteName}>{team.nombreEquipo}</Text>
                        <Text style={styles.favoriteEnrollment}>{team.division || 'Sin división'}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => onAddFavorite(team)}>
                      <Text style={[styles.starIcon, { color: team.isFavorite ? '#ffd84d' : '#ffffff' }]}>★</Text>
                    </Pressable>
                  </Pressable>
                ))}

                {playerSearchResults.map((player) => (
                  <Pressable
                    key={player.key}
                    style={styles.searchCard}
                    onPress={() => {
                      closeSearchOverlay();
                      onGoPlayerDetail?.(player.id);
                    }}
                  >
                    <View style={styles.searchMainInfo}>
                      <View style={styles.playerSearchTextWrap}>
                        <Text style={styles.favoriteName}>{player.nombreCompleto}</Text>
                        <Text style={styles.favoriteEnrollment}>{player.equipoNombre || 'Sin equipo'}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => onAddFavorite(player)}>
                      <Text style={[styles.starIcon, { color: player.isFavorite ? '#ffd84d' : '#ffffff' }]}>★</Text>
                    </Pressable>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appLogo: { width: 34, height: 34, borderRadius: 17 },
  userName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: { fontSize: 18 },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayPanel: {
    width: '94%',
    maxHeight: '78%',
    backgroundColor: 'rgba(5, 15, 29, 0.98)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ffffff',
    padding: 14,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overlayTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  overlayClose: { color: '#fff', fontSize: 26, fontWeight: '700', paddingHorizontal: 6 },
  overlayResults: { marginTop: 6 },
  searchRow: {
    marginBottom: 8,
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 14,
    color: '#0d203d',
    fontWeight: '600',
  },
  scrollContent: { paddingBottom: 30 },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  liveMatchesRow: { gap: 12, paddingRight: 8 },
  liveCard: {
    backgroundColor: 'rgba(5, 15, 29, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 4,
    borderColor: '#ffffff',
    width: 320,
  },
  liveBadge: { color: '#ff5d5d', fontWeight: '800', marginBottom: 8, alignSelf: 'center', textAlign: 'center' },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  teamColumn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scoreColumn: { width: 108, alignItems: 'center', justifyContent: 'center' },
  shield: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  scoreText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  teamAbbr: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  emptyText: { color: '#e4ebf7', fontStyle: 'italic', marginBottom: 8 },
  searchCard: {
    marginTop: 10,
    backgroundColor: 'rgba(5, 15, 29, 0.92)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchMainInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  searchTextWrap: { marginLeft: 10, flexShrink: 1 },
  playerSearchTextWrap: { flexShrink: 1 },
  starIcon: { fontSize: 28, marginLeft: 10 },
  favoriteCard: {
    marginTop: 10,
    backgroundColor: 'rgba(5, 15, 29, 0.92)',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  favoriteTop: { flexDirection: 'row', alignItems: 'center' },
  favoriteInfo: { marginLeft: 10, flexShrink: 1 },
  favoriteName: { color: '#fff', fontWeight: '800', fontSize: 17 },
  favoriteEnrollment: { color: '#c7d4e5', fontSize: 12, marginTop: 2 },
  statsGrid: {
    marginTop: 16,
    width: '90%',
    alignSelf: 'center',
  },
  statsGridHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    paddingBottom: 6,
  },
  statsGridValues: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
  },
  statsHeaderText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },
  statsValueText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  statsDivider: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    fontSize: 16,
  },
  playerCard: {
    marginTop: 10,
    backgroundColor: 'rgba(5, 15, 29, 0.92)',
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  playerTop: { flexDirection: 'row', alignItems: 'center' },
  playerPhoto: { width: 84, height: 84, borderRadius: 14, backgroundColor: '#fff' },
  playerIdentity: { marginLeft: 12, flex: 1 },
  playerName: { color: '#fff', fontWeight: '800', fontSize: 20 },
  playerCategory: { color: '#b6c4d8', fontSize: 15, marginTop: 3, fontWeight: '600' },
  playerStatsRow: { marginTop: 16, flexDirection: 'row', alignItems: 'stretch' },
  playerStatsColumn: { justifyContent: 'space-between', rowGap: 8, minWidth: 58 },
  playerStatsLabel: { color: '#ffffff', fontSize: 15, fontWeight: '800', alignSelf: 'center' },
  playerStatsValue: { color: '#ffffff', fontSize: 16, fontWeight: '700', alignSelf: 'center' },
  playerVerticalDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginHorizontal: 14,
  },
  playerLastMatch: { flex: 1 },
  playerLastMatchTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    textDecorationLine: 'underline',
    marginBottom: 20,
    alignSelf: 'center'
  },
  playerLastMatchStats: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between'
  },
  centerMessageBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helperText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 14,
  }
});
