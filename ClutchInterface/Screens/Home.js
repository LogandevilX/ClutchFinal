import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchHomeData } from '../services/homeService';

const backgroundImage = require('../assets/Fondo_Home.png');
const defaultShield = require('../assets/LogoClutch.png');

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

  return <Image source={defaultShield} style={styles.shield} />;
}

export default function HomeScreen({ user, onLogout }) {
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
          <View>
            <Text style={styles.welcomeText}>Hola, {user?.apodo || 'usuario'}</Text>
            <Text style={styles.subtitle}>Sigue el partido y tus favoritos</Text>
          </View>
          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Salir</Text>
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
                      </View>
                    </View>
                    <View style={styles.statsRow}>
                      <Text style={styles.statsText}>PJ {(item.team.partidosGanados || 0) + (item.team.partidosPerdidos || 0)}</Text>
                      <Text style={styles.statsText}>PG {item.team.partidosGanados || 0}</Text>
                      <Text style={styles.statsText}>PP {item.team.partidosPerdidos || 0}</Text>
                      <Text style={styles.statsText}>PPP {item.team.puntosAFavor || 0}</Text>
                      <Text style={styles.statsText}>PCPP {item.team.puntosEnContra || 0}</Text>
                    </View>
                  </View>
                );
              }

              return (
                <View key={item.id} style={styles.playerCard}>
                  <Text style={styles.playerName}>
                    {item.player.nombre} {item.player.primerApellido || ''} {item.player.segundoApellido || ''}
                  </Text>
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
  safeArea: { flex: 1, paddingHorizontal: 18, paddingVertical: 12 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#d6deed', marginTop: 4 },
  logoutButton: {
    backgroundColor: 'rgba(126,31,38,0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  logoutText: { color: '#fff', fontWeight: '700' },
  scrollContent: { paddingBottom: 30 },
  sectionHeader: { marginTop: 10, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  liveMatchesRow: { gap: 12 },
  liveCard: {
    backgroundColor: 'rgba(14, 31, 55, 0.88)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(21, 44, 70, 0.9)',
    borderRadius: 18,
    padding: 12,
  },
  favoriteTop: { flexDirection: 'row', alignItems: 'center' },
  favoriteInfo: { marginLeft: 10, flexShrink: 1 },
  favoriteName: { color: '#fff', fontWeight: '800', fontSize: 20 },
  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  statsText: { color: '#fff', fontWeight: '700' },
  playerCard: {
    marginTop: 8,
    backgroundColor: 'rgba(5, 15, 29, 0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  playerName: { color: '#fff', fontWeight: '700', fontSize: 17 },
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
  },
  retryButton: {
    backgroundColor: '#7E1F26',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
