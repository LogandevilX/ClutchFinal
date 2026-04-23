import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchHomeData } from '../services/homeService';

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

const getPlayerCategory = (player) =>
  [player?.categoria, player?.subcategoria, player?.nivel].filter(Boolean).join(' - ');

export default function HomeScreen({ user, onGoProfile }) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [liveMatches, setLiveMatches] = useState([]);
  const [followedTeams, setFollowedTeams] = useState([]);
  const [followedPlayers, setFollowedPlayers] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

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

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerLeft} onPress={onGoProfile}>
            <Image source={appLogo} style={styles.appLogo} />
            <Text style={styles.userName}>{user?.apodo || 'Usuario'}</Text>
          </Pressable>
          <Pressable style={styles.searchButton}>
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
              <Pressable style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>Ver todos</Text>
              </Pressable>
            </View>

            {liveMatches.length === 0 ? (
              <Text style={styles.emptyText}>No hay partidos en directo de tus equipos seguidos.</Text>
            ) : (
              <View style={styles.liveMatchesRow}>
                {liveMatches.map((match) => (
                  <View key={match.id} style={styles.liveCard}>
                    <Text style={styles.liveBadge}>● LIVE</Text>
                    <View style={styles.teamRow}>
                      <TeamLogo uri={match.equipoLocal?.urlEscudo} />
                      <Text style={styles.scoreText}>{match.puntosLocal} - {match.puntosVisitante}</Text>
                      <TeamLogo uri={match.equipoVisitante?.urlEscudo} />
                    </View>
                    <View style={styles.teamAbbrRow}>
                      <Text style={styles.teamAbbr}>{match.equipoLocal?.nombreEquipo || 'Local'}</Text>
                      <Text style={styles.teamAbbr}>{match.equipoVisitante?.nombreEquipo || 'Visitante'}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Equipos favoritos</Text>
            </View>

            {favoritesSections.map((item) => {
              if (item.type === 'team') {
                return (
                  <View key={item.id} style={styles.favoriteCard}>
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
                  </View>
                );
              }

              return (
                <View key={item.id} style={styles.playerCard}>
                  <View style={styles.playerTop}>
                    <Image
                      source={item.player.photoUrl ? { uri: item.player.photoUrl } : appLogo}
                      style={styles.playerPhoto}
                    />
                    <View style={styles.playerIdentity}>
                      <Text style={styles.playerName}>{getPlayerFullName(item.player) || 'Jugador'}</Text>
                      <Text style={styles.playerCategory}>{getPlayerCategory(item.player) || 'Sin categoría'}</Text>
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
                </View>
              );
            })}
          </ScrollView>
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
  scrollContent: { paddingBottom: 30 },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  seeAllButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  seeAllText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  liveMatchesRow: { gap: 12 },
  liveCard: {
    backgroundColor: 'rgba(5, 15, 29, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  liveBadge: { color: '#ff5d5d', fontWeight: '800', marginBottom: 8 },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  shield: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  scoreText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  teamAbbrRow: { marginTop: 8, gap: 8, flexDirection: 'row', justifyContent: 'space-between' },
  teamAbbr: { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptyText: { color: '#e4ebf7', fontStyle: 'italic', marginBottom: 8 },

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