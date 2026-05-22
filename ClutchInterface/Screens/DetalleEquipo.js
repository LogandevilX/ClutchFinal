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
import { toggleFavoriteTeam } from '../services/homeService';
import {
  fetchTeamDetailData,
  getAvailableGroups,
  getDefaultGroupId,
  getDefaultPhaseId,
  getFilteredClassification,
  getGroupedMatches,
} from '../services/detalleEquipoService';

const backgroundImage = require('../assets/Fondo_Cancha2.png');
const appLogo = require('../assets/LogoClutch.png');

const tabs = [
  { key: 'plantilla', label: 'Plantilla' },
  { key: 'clasificacion', label: 'Clasificación' },
  { key: 'calendario', label: 'Calendario' },
];

const getMatchBackgroundColor = (estado) => {
  if (estado === 'EN_CURSO') {
    return '#7c2a2a';
  }

  return '#132742';
};

const toValidDate = (value) => {
  const parsed = value ? new Date(value) : null;
  return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

const formatScheduledStart = (value) => {
  const date = toValidDate(value);

  if (!date) {
    return 'Hora no disponible';
  }

  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatLiveClock = (match) => {
  const startDate = toValidDate(match?.fechaHoraInicio);
  const nowMs = Date.now();
  const startMs = startDate ? startDate.getTime() : nowMs;
  const elapsedMinutes = Math.max(0, Math.floor((nowMs - startMs) / 60000));
  const quarter = Math.max(1, Number(match?.periodoActual) || Math.floor(elapsedMinutes / 10) + 1);
  const minuteInQuarter = elapsedMinutes % 10;

  return `Min ${minuteInQuarter}' · Q${quarter}`;
};

const TeamLogo = ({ uri, style }) => (
  <Image source={uri ? { uri } : appLogo} style={[styles.teamLogo, style]} />
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

export default function DetalleEquipoScreen({ teamId, user, onGoBack, onGoPlayerDetail, onGoMatchDetail }) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [favoriteErrorMessage, setFavoriteErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('plantilla');
  const [detailData, setDetailData] = useState(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedJornadaKey, setSelectedJornadaKey] = useState(null);
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
        const defaultPhaseId = getDefaultPhaseId(data);
        setSelectedPhaseId(defaultPhaseId);
        setSelectedGroupId(getDefaultGroupId(data, defaultPhaseId));
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

  const availableGroups = useMemo(() => getAvailableGroups(detailData, selectedPhaseId), [detailData, selectedPhaseId]);

  const groupedMatches = useMemo(
    () => getGroupedMatches(detailData, selectedPhaseId, selectedGroupId),
    [detailData, selectedGroupId, selectedPhaseId]
  );

  const filteredClassification = useMemo(
    () => getFilteredClassification(detailData, selectedPhaseId, selectedGroupId),
    [detailData, selectedGroupId, selectedPhaseId]
  );
  const selectedJornada = useMemo(
    () => groupedMatches.find((jornada) => jornada.key === selectedJornadaKey) || null,
    [groupedMatches, selectedJornadaKey]
  );

  useEffect(() => {
    if (groupedMatches.length === 0) {
      setSelectedJornadaKey(null);
      return;
    }

    if (!groupedMatches.some((jornada) => jornada.key === selectedJornadaKey)) {
      setSelectedJornadaKey(groupedMatches[0].key);
    }
  }, [groupedMatches, selectedJornadaKey]);

  const onToggleFavorite = async () => {
    if (!detailData || !user?.id) {
      return;
    }

    const response = await toggleFavoriteTeam({ usuarioId: user.id, equipoId: teamId });

    if (!response.ok) {
      setFavoriteErrorMessage('No se pudo actualizar el estado de favorito.');
      return;
    }

    setFavoriteErrorMessage('');

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
            <Text style={styles.backButtonText}>❮</Text>
          </Pressable>
          <Pressable
            style={styles.favoriteButton}
            onPress={onToggleFavorite}
          >
            <Text style={[styles.favoriteIcon, { color: detailData?.isFavorite ? '#ffd84d' : '#ffffff' }]}>★</Text>
          </Pressable>
        </View>

        {!loading && !errorMessage && favoriteErrorMessage ? (
          <View style={styles.inlineErrorMessage}>
            <Text style={styles.errorText}>{favoriteErrorMessage}</Text>
          </View>
        ) : null}

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
                  <Pressable key={player.id} style={styles.playerRow} onPress={() => onGoPlayerDetail?.(player.id)}>
                    <Image source={player.pathFoto ? { uri: player.pathFoto } : appLogo} style={styles.playerAvatar} />
                    <View style={styles.playerInfoBlock}>
                      <Text style={styles.playerNumber}>#{String(player?.dorsal || 0).padStart(2, '0')}</Text>
                      <Text style={styles.playerName}>{[player.nombre, player.primerApellido, player.segundoApellido].filter(Boolean).join(' ')}</Text>
                      <View style={styles.playerStatsRow}>
                        <View style={styles.playerStatItem}>
                          <Text style={styles.playerStatLabel}>PJ</Text>
                          <Text style={styles.playerStatValue}>{player?.partidosJugados || 0}</Text>
                        </View>
                        <View style={styles.playerStatItem}>
                          <Text style={styles.playerStatLabel}>MPP</Text>
                          <Text style={[styles.playerStatValue, styles.yellowAccent]}>{player?.minutosPorPartido || 0}</Text>
                        </View>
                        <View style={styles.playerStatItem}>
                          <Text style={styles.playerStatLabel}>PPP</Text>
                          <Text style={[styles.playerStatValue, styles.redAccent]}>{player?.puntosPorPartido || 0}</Text>
                        </View>
                        <View style={styles.playerStatItem}>
                          <Text style={styles.playerStatLabel}>VPP</Text>
                          <Text style={styles.playerStatValue}>{player?.valoracionPorPartido || 0}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.playerArrow}>›</Text>
                  </Pressable>
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
                      setSelectedGroupId(getDefaultGroupId(detailData, faseId));
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
                    <Text style={[styles.classificationHeaderText, styles.teamColTitle]}>EQUIPO</Text>
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
                      <Text style={[styles.classificationText, styles.positionCol]}>
                        {String(team.posicion || index + 1).padStart(2, '0')}
                      </Text>

                      <View style={styles.teamCol}>
                        <TeamLogo uri={team.urlEscudo} style={styles.classificationTeamLogo} />
                        <Text style={styles.teamNameCell}>
                          {team.nombreEquipo}
                        </Text>
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
                      setSelectedGroupId(getDefaultGroupId(detailData, faseId));
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

                {groupedMatches.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jornadaSelectorRow}>
                    {groupedMatches.map((jornada) => (
                      <Pressable
                        key={jornada.key}
                        style={[
                          styles.jornadaButton,
                          selectedJornadaKey === jornada.key ? styles.jornadaButtonActive : null,
                        ]}
                        onPress={() => setSelectedJornadaKey(jornada.key)}
                      >
                        <Text
                          style={[
                            styles.jornadaButtonLabel,
                            selectedJornadaKey === jornada.key ? styles.jornadaButtonLabelActive : null,
                          ]}
                        >
                          {jornada.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}

                {selectedJornada ? (
                  <View key={selectedJornada.key} style={styles.jornadaBlock}>
                    <Text style={styles.jornadaTitle}>{selectedJornada.label}</Text>
                    {selectedJornada.dates.map((dateGroup) => (
                      <View key={`${selectedJornada.key}-${dateGroup.dateLabel}`} style={styles.dateGroup}>
                        {dateGroup.matches.map((match) => (
                          <Pressable
                            key={match.id}
                            style={[styles.matchCard, { backgroundColor: getMatchBackgroundColor(match.estado) }]}
                            onPress={() => onGoMatchDetail?.(match)}
                          >
                            {match.estado === 'EN_CURSO' ? <Text style={styles.liveTag}>LIVE</Text> : null}
                            {match.estado === 'PROGRAMADO' ? <Text style={styles.matchDateText}>{dateGroup.dateLabel}</Text> : null}
                            <Text style={styles.matchTimeText}>
                              {match.estado === 'PROGRAMADO' ? formatScheduledStart(match.fechaHoraInicio) : null}
                              {match.estado === 'EN_CURSO' ? formatLiveClock(match) : null}
                              {match.estado === 'FINALIZADO' ? 'Finalizado' : null}
                            </Text>
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
                          </Pressable>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}
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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(5, 15, 29, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: '#fff', fontWeight: '900', fontSize: 26, lineHeight: 26, marginRight: 2 },
  favoriteButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: { fontSize: 30, marginLeft: 2 },
  centerMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineErrorMessage: {
    paddingHorizontal: 18,
    paddingBottom: 8,
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
    justifyContent: 'flex-start',
    gap: 50,
  },
  playerStatItem: {
    alignItems: 'center',
  },
  playerStatLabel: {
    color: '#d6e0ef',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  playerStatValue: {
    marginTop: 2,
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  classificationHeaderText: {
    width: 34,
    color: '#111',
    fontWeight: '900',
    fontSize: 14,
    textAlign: 'center',
  },
  classificationRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
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
    fontWeight: '800',
    textAlign: 'center',
    width: 34,
    fontSize: 16,
  },
  positionCol: {
    width: 38,
  },
  teamColTitle: {
    flex: 1,
    textAlign: 'left',
    paddingLeft: 6,
    color: '#111',
    fontWeight: '900',
    fontSize: 14,
  },
  teamCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 10,
  },
  classificationTeamLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
  },
  teamNameCell: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
    textAlign: 'left',
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
  jornadaSelectorRow: {
    gap: 8,
    paddingBottom: 4,
  },
  jornadaButton: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#16263f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jornadaButtonActive: {
    backgroundColor: '#7c2a2a',
  },
  jornadaButtonLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  jornadaButtonLabelActive: {
    color: '#fff',
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
  matchCard: {
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minHeight: 205,
    justifyContent: 'space-between',
  },
  liveTag: {
    alignSelf: 'center',
    color: '#fff',
    fontWeight: '900',
    marginBottom: 2,
  },
  matchDateText: {
    color: '#dce7f4',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  matchTimeText: {
    color: '#dce7f4',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
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
    width: '100%',
  },
  scoreText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
  venueWrap: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    alignSelf: 'stretch',
  },
  venueText: {
    color: '#1b2e4a',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
