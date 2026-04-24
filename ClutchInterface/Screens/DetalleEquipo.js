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
import { fetchTeamDetailData, toggleFavoriteTeam } from '../services/homeService';

const backgroundImage = require('../assets/Fondo_Cancha.png');
const appLogo = require('../assets/LogoClutch.png');

const tabs = [
  { key: 'plantilla', label: 'Plantilla' },
  { key: 'clasificacion', label: 'Clasificación' },
  { key: 'calendario', label: 'Calendario' },
];

const toDate = (value) => {
  const parsed = value ? new Date(value) : null;
  return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

const formatDate = (value) => {
  const date = toDate(value);

  if (!date) {
    return 'Sin fecha';
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getWeekNumber = (value) => {
  const date = toDate(value);

  if (!date) {
    return 0;
  }

  const dateUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = dateUTC.getUTCDay() || 7;
  dateUTC.setUTCDate(dateUTC.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dateUTC.getUTCFullYear(), 0, 1));
  return Math.ceil((((dateUTC - yearStart) / 86400000) + 1) / 7);
};

const getMatchBackgroundColor = (estado) => {
  if (estado === 'FINALIZADO') {
    return '#0f5f34';
  }

  if (estado === 'EN_CURSO') {
    return '#8d1d1d';
  }

  return '#0d0d0d';
};

const TeamLogo = ({ uri }) => (
  <Image source={uri ? { uri } : appLogo} style={styles.teamLogo} />
);

const DropdownFilter = ({ label, value, open, onToggle, options, onSelect }) => (
  <View style={styles.filterBox}>
    <Text style={styles.filterLabel}>{label}</Text>
    <Pressable style={styles.selectButton} onPress={onToggle}>
      <Text style={styles.selectText}>{value}</Text>
      <Text style={styles.selectChevron}>▾</Text>
    </Pressable>
    {open ? (
      <View style={styles.dropdownMenu}>
        {options.map((option) => (
          <Pressable
            key={option.key}
            style={styles.dropdownItem}
            onPress={() => onSelect(option.value)}
          >
            <Text style={styles.dropdownText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    ) : null}
  </View>
);

export default function DetalleEquipoScreen({ teamId, user, onGoBack }) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('plantilla');
  const [detailData, setDetailData] = useState(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [isPhaseMenuOpen, setIsPhaseMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!teamId || !user?.id) {
        setErrorMessage('No se pudo identificar el equipo a mostrar.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchTeamDetailData({ usuarioId: user.id, equipoId: teamId });

        if (!mounted) {
          return;
        }

        setDetailData(data);
        setSelectedPhaseId(data.team?.inscripcion?.faseId || data.phases?.[0]?.faseId || null);
        setSelectedGroupId(data.team?.inscripcion?.grupoId || null);
      } catch (error) {
        if (mounted) {
          setErrorMessage('No se pudieron cargar los datos del equipo.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [teamId, user?.id]);

  const availableGroups = useMemo(
    () => detailData?.groupsByPhase?.[selectedPhaseId] || [],
    [detailData?.groupsByPhase, selectedPhaseId]
  );

  const groupedMatches = useMemo(() => {
    const selectedPhaseGroupIds = new Set((detailData?.groupsByPhase?.[selectedPhaseId] || []).map((group) => group.grupoId));

    const filteredMatches = (detailData?.matches || []).filter((match) => {
      if (selectedPhaseId && selectedPhaseGroupIds.size > 0 && !selectedPhaseGroupIds.has(match?.grupoId)) {
        return false;
      }

      if (selectedGroupId && match?.grupoId !== selectedGroupId) {
        return false;
      }

      return true;
    });

    const jornadasMap = new Map();

    filteredMatches.forEach((match) => {
      const date = toDate(match?.fechaHoraInicio);
      const year = date ? date.getFullYear() : 0;
      const week = getWeekNumber(match?.fechaHoraInicio);
      const jornadaKey = `${year}-${week}`;
      const jornadaLabel = week ? `Jornada ${week}` : 'Jornada sin asignar';
      const dateLabel = formatDate(match?.fechaHoraInicio);

      if (!jornadasMap.has(jornadaKey)) {
        jornadasMap.set(jornadaKey, {
          key: jornadaKey,
          label: jornadaLabel,
          sortValue: date ? date.getTime() : 0,
          dates: new Map(),
        });
      }

      const jornada = jornadasMap.get(jornadaKey);

      if (!jornada.dates.has(dateLabel)) {
        jornada.dates.set(dateLabel, []);
      }

      jornada.dates.get(dateLabel).push(match);
    });

    return Array.from(jornadasMap.values())
      .sort((a, b) => a.sortValue - b.sortValue)
      .map((jornada) => ({
        ...jornada,
        dates: Array.from(jornada.dates.entries()).map(([dateLabel, matches]) => ({
          dateLabel,
          matches,
        })),
      }));
  }, [detailData?.groupsByPhase, detailData?.matches, selectedGroupId, selectedPhaseId]);

  const filteredClassification = useMemo(
    () =>
      (detailData?.classification || []).filter((team) => {
        if (selectedPhaseId && team?.faseId && team.faseId !== selectedPhaseId) {
          return false;
        }

        if (selectedGroupId && team?.grupoId && team.grupoId !== selectedGroupId) {
          return false;
        }

        return true;
      }),
    [detailData?.classification, selectedGroupId, selectedPhaseId]
  );

  const onToggleFavorite = async () => {
    if (!detailData || !user?.id) {
      return;
    }

    const response = await toggleFavoriteTeam({ usuarioId: user.id, equipoId: teamId });

    if (!response.ok) {
      setErrorMessage('No se pudo actualizar el estado de favorito.');
      return;
    }

    setDetailData((previous) => ({
      ...previous,
      isFavorite: !previous.isFavorite,
    }));
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerTop}>
          <Image source={appLogo} style={styles.appLogo} />
          <Text style={styles.userName}>{user?.apodo || 'Usuario'}</Text>
        </View>

        <View style={styles.actionBar}>
          <Pressable style={styles.backButton} onPress={onGoBack}>
            <Text style={styles.backButtonText}>← Retroceder</Text>
          </Pressable>
          <Pressable
            style={[
              styles.favoriteButton,
              { backgroundColor: detailData?.isFavorite ? '#ffd84d' : '#ffffff' },
            ]}
            onPress={onToggleFavorite}
          >
            <Text style={styles.favoriteIcon}>★</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerMessage}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : null}

        {!loading && errorMessage ? (
          <View style={styles.centerMessage}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!loading && !errorMessage && detailData ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.teamHeaderInfo}>
              <TeamLogo uri={detailData.team?.urlEscudo} />
              <View style={styles.teamIdentity}>
                <Text style={styles.teamName}>{detailData.team?.nombreEquipo || 'Equipo'}</Text>
                <Text style={styles.infoText}>División: {detailData.team?.inscripcion?.nombreDivision || '-'}</Text>
                <Text style={styles.infoText}>Grupo: {detailData.team?.inscripcion?.nombreGrupo || '-'}</Text>
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
                <Text style={styles.statsValueText}>{(detailData.team?.partidosGanados || 0) + (detailData.team?.partidosPerdidos || 0)}</Text>
                <Text style={styles.statsDivider}>|</Text>
                <Text style={styles.statsValueText}>{detailData.team?.partidosGanados || 0}</Text>
                <Text style={styles.statsDivider}>|</Text>
                <Text style={styles.statsValueText}>{detailData.team?.partidosPerdidos || 0}</Text>
                <Text style={styles.statsDivider}>|</Text>
                <Text style={styles.statsValueText}>{detailData.team?.puntosAFavor || 0}</Text>
                <Text style={styles.statsDivider}>|</Text>
                <Text style={styles.statsValueText}>{detailData.team?.puntosEnContra || 0}</Text>
              </View>
            </View>

            <View style={styles.tabsRow}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, activeTab === tab.key ? styles.tabButtonActive : null]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.tabLabel, activeTab === tab.key ? styles.tabLabelActive : null]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {activeTab === 'plantilla' ? (
              <View style={styles.tabContent}>
                {detailData.players.map((player) => (
                  <View key={player.id} style={styles.playerRow}>
                    <Image source={player.pathFoto ? { uri: player.pathFoto } : appLogo} style={styles.playerAvatar} />
                    <View style={styles.playerInfoBlock}>
                      <Text style={styles.playerNumber}>#{String(player?.dorsal || 0).padStart(2, '0')}</Text>
                      <Text style={styles.playerName}>{[player.nombre, player.primerApellido, player.segundoApellido].filter(Boolean).join(' ')}</Text>
                      <View style={styles.playerStatsRow}>
                        <View>
                          <Text style={styles.playerStatLabel}>PJ</Text>
                          <Text style={styles.playerStatValue}>{player?.partidosJugados || 0}</Text>
                        </View>
                        <View>
                          <Text style={styles.playerStatLabel}>MPP</Text>
                          <Text style={[styles.playerStatValue, styles.yellowAccent]}>{player?.minutosPorPartido || 0}</Text>
                        </View>
                        <View>
                          <Text style={styles.playerStatLabel}>PPP</Text>
                          <Text style={[styles.playerStatValue, styles.redAccent]}>{player?.puntosPorPartido || 0}</Text>
                        </View>
                        <View>
                          <Text style={styles.playerStatLabel}>VPP</Text>
                          <Text style={styles.playerStatValue}>{player?.valoracionPorPartido || 0}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.playerArrow}>›</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {activeTab === 'clasificacion' ? (
              <View style={styles.tabContent}>
                <View style={styles.filtersRow}>
                  <DropdownFilter
                    label="Fase"
                    value={detailData.phases.find((phase) => phase.faseId === selectedPhaseId)?.nombreFase || 'Selecciona fase'}
                    open={isPhaseMenuOpen}
                    onToggle={() => {
                      setIsGroupMenuOpen(false);
                      setIsPhaseMenuOpen((prev) => !prev);
                    }}
                    options={(detailData.phases || []).map((phase) => ({
                      key: phase.faseId,
                      value: phase.faseId,
                      label: phase.nombreFase,
                    }))}
                    onSelect={(faseId) => {
                      setSelectedPhaseId(faseId);
                      const firstGroup = detailData.groupsByPhase?.[faseId]?.[0]?.grupoId || null;
                      setSelectedGroupId(firstGroup);
                      setIsPhaseMenuOpen(false);
                    }}
                  />

                  <DropdownFilter
                    label="Grupo"
                    value={availableGroups.find((group) => group.grupoId === selectedGroupId)?.nombreGrupo || 'Selecciona grupo'}
                    open={isGroupMenuOpen}
                    onToggle={() => {
                      setIsPhaseMenuOpen(false);
                      setIsGroupMenuOpen((prev) => !prev);
                    }}
                    options={availableGroups.map((group) => ({
                      key: group.grupoId,
                      value: group.grupoId,
                      label: group.nombreGrupo,
                    }))}
                    onSelect={(grupoId) => {
                      setSelectedGroupId(grupoId);
                      setIsGroupMenuOpen(false);
                    }}
                  />
                </View>

                <View style={styles.classificationTable}>
                  <View style={styles.classificationHeaderRow}>
                    <Text style={[styles.classificationHeaderText, styles.positionCol]}>POS</Text>
                    <Text style={[styles.classificationHeaderText, styles.teamCol]}>EQUIPO</Text>
                    <Text style={styles.classificationHeaderText}>PJ</Text>
                    <Text style={styles.classificationHeaderText}>PG</Text>
                    <Text style={styles.classificationHeaderText}>PP</Text>
                    <Text style={styles.classificationHeaderText}>P</Text>
                  </View>

                  {filteredClassification.map((team, index) => (
                    <View
                      key={team.id}
                      style={[
                        styles.classificationRow,
                        index === 0 ? styles.firstPlace : null,
                        index === filteredClassification.length - 1 ? styles.lastPlace : null,
                      ]}
                    >
                      <Text style={[styles.classificationText, styles.positionCol]}>{String(team.posicion || index + 1).padStart(2, '0')}</Text>
                      <View style={styles.teamCol}>
                        <Text style={styles.teamNameCell}>{team.nombreEquipo}</Text>
                      </View>
                      <Text style={styles.classificationText}>{(team.partidosGanados || 0) + (team.partidosPerdidos || 0)}</Text>
                      <Text style={styles.classificationText}>{team.partidosGanados || 0}</Text>
                      <Text style={styles.classificationText}>{team.partidosPerdidos || 0}</Text>
                      <Text style={styles.classificationText}>{team.puntos || 0}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {activeTab === 'calendario' ? (
              <View style={styles.tabContent}>
                <View style={styles.filtersRow}>
                  <DropdownFilter
                    label="Fase"
                    value={detailData.phases.find((phase) => phase.faseId === selectedPhaseId)?.nombreFase || 'Selecciona fase'}
                    open={isPhaseMenuOpen}
                    onToggle={() => {
                      setIsGroupMenuOpen(false);
                      setIsPhaseMenuOpen((prev) => !prev);
                    }}
                    options={(detailData.phases || []).map((phase) => ({
                      key: phase.faseId,
                      value: phase.faseId,
                      label: phase.nombreFase,
                    }))}
                    onSelect={(faseId) => {
                      setSelectedPhaseId(faseId);
                      const firstGroup = detailData.groupsByPhase?.[faseId]?.[0]?.grupoId || null;
                      setSelectedGroupId(firstGroup);
                      setIsPhaseMenuOpen(false);
                    }}
                  />

                  <DropdownFilter
                    label="Grupo"
                    value={availableGroups.find((group) => group.grupoId === selectedGroupId)?.nombreGrupo || 'Selecciona grupo'}
                    open={isGroupMenuOpen}
                    onToggle={() => {
                      setIsPhaseMenuOpen(false);
                      setIsGroupMenuOpen((prev) => !prev);
                    }}
                    options={availableGroups.map((group) => ({
                      key: group.grupoId,
                      value: group.grupoId,
                      label: group.nombreGrupo,
                    }))}
                    onSelect={(grupoId) => {
                      setSelectedGroupId(grupoId);
                      setIsGroupMenuOpen(false);
                    }}
                  />
                </View>

                {groupedMatches.length === 0 ? <Text style={styles.emptyText}>No hay partidos para los filtros seleccionados.</Text> : null}

                {groupedMatches.map((jornada) => (
                  <View key={jornada.key} style={styles.jornadaBlock}>
                    <Text style={styles.jornadaTitle}>{jornada.label}</Text>
                    {jornada.dates.map((dateGroup) => (
                      <View key={`${jornada.key}-${dateGroup.dateLabel}`} style={styles.dateGroup}>
                        <Text style={styles.dateTitle}>{dateGroup.dateLabel}</Text>
                        {dateGroup.matches.map((match) => (
                          <View key={match.id} style={[styles.matchCard, { backgroundColor: getMatchBackgroundColor(match.estado) }]}>
                            {match.estado === 'EN_CURSO' ? <Text style={styles.liveTag}>LIVE</Text> : null}
                            <View style={styles.matchMainRow}>
                              <View style={styles.sideTeamWrap}>
                                <TeamLogo uri={match.equipoLocal?.urlEscudo} />
                                <Text style={styles.sideTeamText}>{match.equipoLocal?.nombreEquipo || 'Local'}</Text>
                              </View>

                              <Text style={styles.scoreText}>
                                {match.estado === 'PROGRAMADO' ? '---' : `${match.puntosLocal || 0} - ${match.puntosVisitante || 0}`}
                              </Text>

                              <View style={styles.sideTeamWrap}>
                                <TeamLogo uri={match.equipoVisitante?.urlEscudo} />
                                <Text style={styles.sideTeamText}>{match.equipoVisitante?.nombreEquipo || 'Visitante'}</Text>
                              </View>
                            </View>

                            <View style={styles.venueWrap}>
                              <Text style={styles.venueText}>{match.pabellonDeJuego || 'Sin dirección del pabellón'}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appLogo: { width: 34, height: 34, borderRadius: 17 },
  userName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  actionBar: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(5, 15, 29, 0.88)',
  },
  backButtonText: { color: '#fff', fontWeight: '700' },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: { fontSize: 22, color: '#111' },
  centerMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#fff',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  teamHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamLogo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fff',
  },
  teamIdentity: {
    marginLeft: 10,
    flex: 1,
  },
  teamName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  infoText: {
    marginTop: 2,
    color: '#d6e0ef',
    fontSize: 13,
  },
  statsGrid: {
    marginBottom: 16,
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
    fontSize: 13,
  },
  statsValueText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  statsDivider: {
    color: 'rgba(255,255,255,0.5)',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    backgroundColor: '#16263f',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#7c2a2a',
  },
  tabLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabContent: {
    marginTop: 12,
  },
  playerRow: {
    borderRadius: 16,
    backgroundColor: '#061528',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
  },
  playerInfoBlock: {
    flex: 1,
  },
  playerNumber: {
    color: '#ecf1fa',
    fontWeight: '800',
    fontSize: 12,
  },
  playerName: {
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },
  playerStatsRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerStatLabel: {
    color: '#d6e0ef',
    fontSize: 12,
    fontWeight: '700',
  },
  playerStatValue: {
    marginTop: 2,
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  yellowAccent: {
    color: '#ffd84d',
  },
  redAccent: {
    color: '#ff3f3f',
  },
  playerArrow: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '300',
  },
  classificationTable: {
    marginTop: 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#061528',
  },
  classificationHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#cfd4de',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  classificationHeaderText: {
    width: 30,
    color: '#111',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
  },
  classificationRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#061528',
    flexDirection: 'row',
    alignItems: 'center',
  },
  firstPlace: {
    backgroundColor: '#1ea32b',
  },
  lastPlace: {
    backgroundColor: '#612020',
  },
  classificationText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    width: 30,
    fontSize: 12,
  },
  positionCol: {
    width: 34,
  },
  teamCol: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 6,
  },
  teamNameCell: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  filterBox: {
    flex: 1,
    zIndex: 10,
  },
  filterLabel: {
    color: '#fff',
    marginBottom: 4,
    fontWeight: '700',
  },
  selectButton: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#132742',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  selectChevron: {
    color: '#fff',
    marginLeft: 8,
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: '#132742',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyText: {
    color: '#dce7f4',
    fontStyle: 'italic',
  },
  jornadaBlock: {
    marginTop: 8,
  },
  jornadaTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  dateGroup: {
    marginBottom: 12,
  },
  dateTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
  },
  matchCard: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  liveTag: {
    alignSelf: 'center',
    color: '#fff',
    fontWeight: '900',
    marginBottom: 6,
  },
  matchMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sideTeamWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  sideTeamText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
  venueWrap: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  venueText: {
    color: '#1b2e4a',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
