import { useEffect, useMemo, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  DEFENSIVE_ACTIONS,
  SHOT_ACTIONS,
  fetchMatchState,
  fetchPlayerActas,
  finishMatch,
  finishPeriod,
  formatClock,
  sendEvent,
  startPeriod,
} from '../services/PartidoService';

const SHOT_GRID = [
  ['Triple45Iz', 'TripleCabecera', 'Triple45Der'],
  ['CuarentaCincoIz', 'Cabecera', 'CuarentaCincoDer'],
  ['TripleEsquinaIz', 'Pintura', 'TripleEsquinaDerecha'],
  ['EsquinaIz', null, 'EsquinaDer'],
];

const findActaByPlayer = (actas, jugadorId) => (actas || []).find((acta) => String(acta?.jugadorId) === String(jugadorId));
const EVENT_ORDER = { SALIDA: 0, ENTRADA: 1 };

const fallbackState = (setupData) => ({
  partido: setupData?.partido || null,
  actas: [],
  historial: [],
});

const buildRosterFromState = (state, setupData, sideKey) => {
  const setupTeam = sideKey === 'local' ? setupData?.local : setupData?.visitante;
  const stateTeam = sideKey === 'local' ? state?.partido?.equipoLocal : state?.partido?.equipoVisitante;
  const teamId = setupTeam?.id || stateTeam?.id;

  const basePlayers = (setupTeam?.jugadoresDisponibles || []).map((player) => ({
    ...player,
    equipoId: teamId,
    nombreCompleto: player.nombreCompleto || [player?.nombre, player?.primerApellido].filter(Boolean).join(' ').trim() || `Jugador #${player?.id || ''}`,
  }));

  const actasTeam = (state?.actas || []).filter((acta) => String(acta?.equipoId) === String(teamId));
  const rosterFromActas = actasTeam.map((acta) => ({
    id: acta?.jugadorId,
    equipoId: acta?.equipoId,
    nombreCompleto: `Jugador #${acta?.jugadorId}`,
    dorsal: acta?.dorsal || 0,
    falta: acta?.falta || 0,
    puntos: acta?.puntos || 0,
  }));

  const merged = basePlayers.length > 0
    ? basePlayers
      .filter((player) => actasTeam.some((acta) => String(acta?.jugadorId) === String(player.id)))
      .map((player) => {
        const acta = findActaByPlayer(actasTeam, player.id);
        return {
          ...player,
          dorsal: acta?.dorsal || player?.dorsal || 0,
          falta: acta?.falta || 0,
          puntos: acta?.puntos || 0,
        };
      })
    : rosterFromActas;

  return merged.sort((a, b) => Number(a.dorsal || 0) - Number(b.dorsal || 0));
};

function PlayerCard({ player, isSelected, onSelect, onShowActa, onSub }) {
  return (
    <View style={styles.playerRow}>
      <Pressable style={[styles.playerCard, isSelected ? styles.playerCardSelected : null]} onPress={onSelect}>
        <Text style={styles.playerNumber}>#{String(player?.dorsal || 0).padStart(2, '0')}</Text>
        <Text style={styles.playerFouls}>Faltas: {player?.falta || 0}</Text>
      </Pressable>

      <View style={styles.playerButtonsCol}>
        <Pressable style={styles.actionMiniButton} onPress={onSub}>
          <Text style={styles.miniButtonText}>Sust.</Text>
        </Pressable>
        <Pressable style={[styles.actionMiniButton, styles.verActaButton]} onPress={onShowActa}>
          <Text style={styles.miniButtonText}>Ver acta</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PartidoScreen({ partido, setupData, initialState, onExit }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(initialState || fallbackState(setupData));
  const [localRoster, setLocalRoster] = useState([]);
  const [awayRoster, setAwayRoster] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [mainClock, setMainClock] = useState(0);
  const [shotClock, setShotClock] = useState(24);
  const [clockRunning, setClockRunning] = useState(false);
  const [pose14Mode, setPose14Mode] = useState(false);
  const [showShotResult, setShowShotResult] = useState(false);
  const [pendingShot, setPendingShot] = useState(null);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);
  const [showPlayerActas, setShowPlayerActas] = useState(false);
  const [playerActas, setPlayerActas] = useState([]);
  const [loadingActas, setLoadingActas] = useState(false);
  const [substitutionTarget, setSubstitutionTarget] = useState(null);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [processingSubstitution, setProcessingSubstitution] = useState(false);
  const [nextPeriodStarters, setNextPeriodStarters] = useState({ local: [], visitante: [] });

  const partidoId = partido?.id || setupData?.partido?.id;
  const teamLocal = setupData?.local || state?.partido?.equipoLocal;
  const teamVisitante = setupData?.visitante || state?.partido?.equipoVisitante;

  const currentPeriod = Number(state?.partido?.periodoActual || 1);
  const isFourthFinished = currentPeriod >= 4 && mainClock >= 600;

  const teamPoints = useMemo(() => {
    const points = { local: 0, visitante: 0 };

    (state?.actas || []).forEach((acta) => {
      if (String(acta?.equipoId) === String(teamLocal?.id)) {
        points.local += Number(acta?.puntos || 0);
      }

      if (String(acta?.equipoId) === String(teamVisitante?.id)) {
        points.visitante += Number(acta?.puntos || 0);
      }
    });

    return points;
  }, [state?.actas, teamLocal?.id, teamVisitante?.id]);

  const playersOnCourtByTeam = useMemo(() => {
    const onCourt = {};
    const historialOrdenado = [...(state?.historial || [])].sort((a, b) => {
      const periodoA = Number(a?.periodo || 0);
      const periodoB = Number(b?.periodo || 0);
      if (periodoA !== periodoB) return periodoA - periodoB;

      const segundoA = Number((a?.segundo ?? ((a?.minuto || 0) * 60)) || 0);
      const segundoB = Number((b?.segundo ?? ((b?.minuto || 0) * 60)) || 0);
      if (segundoA !== segundoB) return segundoA - segundoB;

      const orderA = EVENT_ORDER[a?.tipoEvento] ?? 99;
      const orderB = EVENT_ORDER[b?.tipoEvento] ?? 99;
      if (orderA !== orderB) return orderA - orderB;

      return Number(a?.id || 0) - Number(b?.id || 0);
    });

    historialOrdenado.forEach((evento) => {
      if (!evento?.equipoId || !evento?.jugadorId) {
        return;
      }

      const tipo = evento?.tipoEvento;
      if (tipo !== 'ENTRADA' && tipo !== 'SALIDA') {
        return;
      }

      const teamKey = String(evento.equipoId);
      if (!onCourt[teamKey]) {
        onCourt[teamKey] = new Set();
      }

      if (tipo === 'ENTRADA') {
        onCourt[teamKey].add(String(evento.jugadorId));
      } else {
        onCourt[teamKey].delete(String(evento.jugadorId));
      }
    });

    return onCourt;
  }, [state?.historial]);

  const localPlayersOnCourt = useMemo(() => {
    const onCourt = playersOnCourtByTeam[String(teamLocal?.id)] || new Set();
    return localRoster.filter((player) => onCourt.has(String(player.id)));
  }, [localRoster, playersOnCourtByTeam, teamLocal?.id]);

  const awayPlayersOnCourt = useMemo(() => {
    const onCourt = playersOnCourtByTeam[String(teamVisitante?.id)] || new Set();
    return awayRoster.filter((player) => onCourt.has(String(player.id)));
  }, [awayRoster, playersOnCourtByTeam, teamVisitante?.id]);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!partidoId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const currentState = await fetchMatchState(partidoId);
        if (!mounted) return;

        setState(currentState);
        setMainClock(Math.floor(Number(currentState?.partido?.minutoActual || 0) * 60));
        setLocalRoster(buildRosterFromState(currentState, setupData, 'local'));
        setAwayRoster(buildRosterFromState(currentState, setupData, 'visitante'));
      } catch (error) {
        if (!mounted) return;
        const fallback = initialState || fallbackState(setupData);
        setState(fallback);
        setLocalRoster(buildRosterFromState(fallback, setupData, 'local'));
        setAwayRoster(buildRosterFromState(fallback, setupData, 'visitante'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [partidoId, setupData]);

  useEffect(() => {
    if (!clockRunning) return undefined;

    const intervalId = setInterval(() => {
      setMainClock((prev) => {
        if (prev >= 600) {
          return 600;
        }
        return prev + 1;
      });

      setShotClock((prev) => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [clockRunning]);

  useEffect(() => {
    if (shotClock > 0) {
      return;
    }

    setClockRunning(false);
    setShotClock(24);
    setPose14Mode(false);
  }, [shotClock]);

  useEffect(() => {
    if (!selectedPlayer?.id || !selectedPlayer?.equipoId) {
      return;
    }

    const onCourt = playersOnCourtByTeam[String(selectedPlayer.equipoId)] || new Set();
    if (!onCourt.has(String(selectedPlayer.id))) {
      setSelectedPlayer(null);
    }
  }, [playersOnCourtByTeam, selectedPlayer]);

  useEffect(() => {
    if (mainClock < 600 || !partidoId) {
      return;
    }

    setClockRunning(false);

    if (isFourthFinished) {
      setShowEndMatchModal(true);
      return;
    }

    finishPeriod(partidoId)
      .then((newState) => {
        setState(newState);
        setShowPeriodModal(true);
      })
      .catch(() => {
        Alert.alert('Periodo no cerrado', 'No se pudo cerrar el periodo actual en el servidor.');
      });
  }, [mainClock, partidoId, isFourthFinished]);

  const minute = Math.floor(mainClock / 60);
  const second = mainClock % 60;

  const handleAddStarter = (side, playerId) => {
    setNextPeriodStarters((previous) => {
      const current = previous[side] || [];
      if (current.includes(playerId)) {
        return { ...previous, [side]: current.filter((id) => id !== playerId) };
      }

      if (current.length >= 5) {
        return previous;
      }

      return { ...previous, [side]: [...current, playerId] };
    });
  };

  const handleStartNextPeriod = async () => {
    if (nextPeriodStarters.local.length !== 5 || nextPeriodStarters.visitante.length !== 5) {
      Alert.alert('Titulares incompletos', 'Debes seleccionar 5 convocados de cada equipo.');
      return;
    }

    const titulares = [
      ...nextPeriodStarters.local.map((jugadorId) => ({ equipoId: teamLocal?.id, jugadorId })),
      ...nextPeriodStarters.visitante.map((jugadorId) => ({ equipoId: teamVisitante?.id, jugadorId })),
    ];

    try {
      const newState = await startPeriod(partidoId, {
        periodo: currentPeriod + 1,
        minuto: 0,
        titulares,
      });

      setState(newState);
      setMainClock(0);
      setShotClock(24);
      setPose14Mode(false);
      setClockRunning(false);
      setNextPeriodStarters({ local: [], visitante: [] });
      setShowPeriodModal(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar el siguiente periodo.');
    }
  };

  const handleSelectPlayer = (player, side) => {
    setSelectedPlayer({
      ...player,
      side,
      equipoId: side === 'local' ? teamLocal?.id : teamVisitante?.id,
    });
  };

  const clearSelectedPlayer = () => {
    setSelectedPlayer(null);
  };

  const handleQuickAction = async (action) => {
    if (!selectedPlayer?.id) {
      return;
    }

    try {
      const updated = await sendEvent(partidoId, {
        equipoId: selectedPlayer.equipoId,
        jugadorId: selectedPlayer.id,
        tipoEvento: action,
        periodo: currentPeriod,
        minuto: minute,
        segundo: second,
      });
      setState(updated);
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la acción.');
    }
  };

  const handleShot = (shotKey) => {
    if (!selectedPlayer?.id) {
      return;
    }

    setPendingShot(SHOT_ACTIONS[shotKey]);
    setShowShotResult(true);
  };

  const handleShotResult = async (isSuccess) => {
    if (!pendingShot || !selectedPlayer?.id) {
      setShowShotResult(false);
      return;
    }

    try {
      const updated = await sendEvent(partidoId, {
        equipoId: selectedPlayer.equipoId,
        jugadorId: selectedPlayer.id,
        tipoEvento: pendingShot.tipoEvento,
        acierto: isSuccess ? 'SI' : 'NO',
        periodo: currentPeriod,
        minuto: minute,
        segundo: second,
        posicion: pendingShot.posicion,
      });

      setState(updated);
      setShowShotResult(false);
      setPendingShot(null);
      setShotClock(24);
      setPose14Mode(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el tiro.');
    }
  };

  const handleFinishMatch = async () => {
    try {
      await finishMatch(partidoId);
      setShowEndMatchModal(false);
      Alert.alert('Partido finalizado', 'El partido se cerró correctamente.', [{ text: 'Aceptar', onPress: onExit }]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo finalizar el partido.');
    }
  };

  const handleOpenPlayerActa = async (player) => {
    try {
      setLoadingActas(true);
      setShowPlayerActas(true);
      const rows = await fetchPlayerActas(player.id);
      setPlayerActas(rows);
    } catch (error) {
      setPlayerActas([]);
    } finally {
      setLoadingActas(false);
    }
  };

  const handleOpenSubstitution = (player, side) => {
    setSubstitutionTarget({
      ...player,
      side,
      equipoId: side === 'local' ? teamLocal?.id : teamVisitante?.id,
    });
    setShowSubstitutionModal(true);
  };

  const benchOptions = useMemo(() => {
    if (!substitutionTarget?.equipoId) {
      return [];
    }

    const roster = substitutionTarget.side === 'local' ? localRoster : awayRoster;
    const onCourt = playersOnCourtByTeam[String(substitutionTarget.equipoId)] || new Set();

    return roster.filter((player) =>
      String(player.id) !== String(substitutionTarget.id) && !onCourt.has(String(player.id)));
  }, [substitutionTarget, localRoster, awayRoster, playersOnCourtByTeam]);

  const handleConfirmSubstitution = async (incomingPlayer) => {
    if (!substitutionTarget?.equipoId || !incomingPlayer?.id) {
      return;
    }

    try {
      setProcessingSubstitution(true);
      await sendEvent(partidoId, {
        equipoId: substitutionTarget.equipoId,
        jugadorId: substitutionTarget.id,
        tipoEvento: 'SALIDA',
        periodo: currentPeriod,
        minuto: minute,
        segundo: second,
      });

      const updated = await sendEvent(partidoId, {
        equipoId: substitutionTarget.equipoId,
        jugadorId: incomingPlayer.id,
        tipoEvento: 'ENTRADA',
        periodo: currentPeriod,
        minuto: minute,
        segundo: second,
      });

      setState(updated);
      setShowSubstitutionModal(false);
      setSubstitutionTarget(null);
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la sustitución.');
    } finally {
      setProcessingSubstitution(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerTeamBox}>
          <Text style={styles.teamSideLabel}>Local</Text>
          <Text style={styles.teamLabel}>{teamLocal?.nombreEquipo || 'Local'}</Text>
          <Text style={styles.teamPoints}>{teamPoints.local}</Text>
        </View>

        <View style={styles.centerHeaderBox}>
          <View style={styles.periodRow}>
            <Text style={styles.periodLabel}>P{currentPeriod}</Text>
            <Pressable
              style={styles.clockControlButton}
              onPress={() => {
                clearSelectedPlayer();
                setMainClock(0);
              }}
            >
              <Text style={styles.clockControlText}>Editar</Text>
            </Pressable>
            {mainClock >= 600 && !isFourthFinished ? (
              <Pressable
                style={styles.nextPeriodButton}
                onPress={() => {
                  clearSelectedPlayer();
                  setShowPeriodModal(true);
                }}
              >
                <Text style={styles.nextPeriodText}>Siguiente periodo</Text>
              </Pressable>
            ) : (
              <Text style={styles.mainClock}>{formatClock(mainClock)} - 10:00</Text>
            )}
          </View>

          <View style={styles.possessionRow}>
            <Pressable
              style={styles.smallControlButton}
              onPress={() => {
                clearSelectedPlayer();
                setShotClock(24);
              }}
            >
              <Text style={styles.smallControlText}>↺24</Text>
            </Pressable>
            <Pressable
              style={styles.smallControlButton}
              onPress={() => {
                clearSelectedPlayer();
                setClockRunning((prev) => !prev);
              }}
            >
              <Text style={styles.smallControlText}>{clockRunning ? 'Pausa' : 'Play'}</Text>
            </Pressable>
            <Text style={styles.shotClockText}>{shotClock} - 0</Text>
            <Pressable
              style={styles.smallControlButton}
              onPress={() => {
                clearSelectedPlayer();
                setShotClock(14);
                setPose14Mode(true);
              }}
            >
              <Text style={styles.smallControlText}>{pose14Mode ? '14*' : '14'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.headerTeamBox, styles.awayBox]}>
          <Text style={styles.teamSideLabel}>Visitante</Text>
          <Text style={styles.teamLabel}>{teamVisitante?.nombreEquipo || 'Visitante'}</Text>
          <Text style={styles.teamPoints}>{teamPoints.visitante}</Text>
        </View>
      </View>

      <Pressable style={styles.mainContent} onPress={clearSelectedPlayer}>
        <View style={styles.sideZone}>
          <ScrollView contentContainerStyle={styles.playersContainer}>
            {localPlayersOnCourt.map((player) => (
              <PlayerCard
                key={`local-${player.id}`}
                player={player}
                isSelected={selectedPlayer?.id === player.id}
                onSelect={() => handleSelectPlayer(player, 'local')}
                onShowActa={() => handleOpenPlayerActa(player)}
                onSub={() => handleOpenSubstitution(player, 'local')}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.centerZone}>
          <View style={styles.shotMap}>
            {SHOT_GRID.map((row, index) => (
              <View key={`row-${index}`} style={styles.shotRow}>
                {row.map((shotKey, colIndex) => (
                  shotKey ? (
                    <Pressable
                      key={shotKey}
                      style={[styles.shotButton, !selectedPlayer?.id ? styles.disabledButton : null]}
                      onPress={() => handleShot(shotKey)}
                      disabled={!selectedPlayer?.id}
                    >
                      <Text style={styles.shotButtonText}>{SHOT_ACTIONS[shotKey].posicion}</Text>
                    </Pressable>
                  ) : (
                    <View key={`empty-slot-${index}-${colIndex}`} style={styles.shotButtonSpacer} />
                  )
                ))}
              </View>
            ))}
          </View>

          <View style={styles.quickActionsRow}>
            {DEFENSIVE_ACTIONS.map((action) => (
              <Pressable
                key={action}
                style={[styles.quickActionBtn, !selectedPlayer?.id ? styles.disabledButton : null]}
                onPress={() => handleQuickAction(action)}
                disabled={!selectedPlayer?.id}
              >
                <Text style={styles.quickActionText}>{action}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sideZone}>
          <ScrollView contentContainerStyle={styles.playersContainer}>
            {awayPlayersOnCourt.map((player) => (
              <PlayerCard
                key={`away-${player.id}`}
                player={player}
                isSelected={selectedPlayer?.id === player.id}
                onSelect={() => handleSelectPlayer(player, 'visitante')}
                onShowActa={() => handleOpenPlayerActa(player)}
                onSub={() => handleOpenSubstitution(player, 'visitante')}
              />
            ))}
          </ScrollView>
        </View>
      </Pressable>

      <Modal visible={showShotResult} transparent animationType="fade" onRequestClose={() => setShowShotResult(false)}>
        <View style={styles.overlayBackdrop}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>Resultado del tiro</Text>
            <View style={styles.overlayActions}>
              <Pressable style={[styles.resultBtn, styles.successBtn]} onPress={() => handleShotResult(true)}>
                <Text style={styles.resultText}>ACIERTO</Text>
              </Pressable>
              <Pressable style={[styles.resultBtn, styles.failBtn]} onPress={() => handleShotResult(false)}>
                <Text style={styles.resultText}>Fallo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPeriodModal} transparent animationType="fade" onRequestClose={() => setShowPeriodModal(false)}>
        <View style={styles.overlayBackdrop}>
          <View style={[styles.overlayCard, styles.periodCard]}>
            <Text style={styles.overlayTitle}>Titulares para P{currentPeriod + 1}</Text>

            <View style={styles.periodColumns}>
              <View style={styles.periodColumn}>
                <Text style={styles.periodTeamLabel}>Local</Text>
                <ScrollView>
                  {localRoster.map((player) => (
                    <Pressable
                      key={`starter-local-${player.id}`}
                      style={[
                        styles.starterRow,
                        nextPeriodStarters.local.includes(player.id) ? styles.starterRowSelected : null,
                      ]}
                      onPress={() => handleAddStarter('local', player.id)}
                    >
                      <Text style={styles.starterText}>#{String(player.dorsal).padStart(2, '0')} {player.nombreCompleto}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.periodColumn}>
                <Text style={styles.periodTeamLabel}>Visitante</Text>
                <ScrollView>
                  {awayRoster.map((player) => (
                    <Pressable
                      key={`starter-away-${player.id}`}
                      style={[
                        styles.starterRow,
                        nextPeriodStarters.visitante.includes(player.id) ? styles.starterRowSelected : null,
                      ]}
                      onPress={() => handleAddStarter('visitante', player.id)}
                    >
                      <Text style={styles.starterText}>#{String(player.dorsal).padStart(2, '0')} {player.nombreCompleto}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Pressable style={styles.startPeriodBtn} onPress={handleStartNextPeriod}>
              <Text style={styles.startPeriodText}>Empezar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showEndMatchModal} transparent animationType="fade" onRequestClose={() => setShowEndMatchModal(false)}>
        <View style={styles.overlayBackdrop}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>Fin del 4º periodo</Text>
            <View style={styles.overlayActions}>
              <Pressable style={[styles.resultBtn, styles.failBtn]} onPress={handleFinishMatch}>
                <Text style={styles.resultText}>Finalizar partido</Text>
              </Pressable>
              <Pressable style={[styles.resultBtn, styles.successBtn]} onPress={() => setShowPeriodModal(true)}>
                <Text style={styles.resultText}>Prórroga</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPlayerActas} transparent animationType="slide" onRequestClose={() => setShowPlayerActas(false)}>
        <View style={styles.overlayBackdrop}>
          <View style={[styles.overlayCard, styles.playerActaCard]}>
            <Text style={styles.overlayTitle}>Actas del jugador</Text>
            {loadingActas ? <ActivityIndicator size="small" color="#FFF" /> : null}
            <ScrollView>
              {playerActas.map((acta) => (
                <Text key={String(acta.id)} style={styles.actaText}>
                  MIN {acta.minutosJugados || 0} · PTS {acta.puntos || 0} · TL {acta.tlAnotados || 0}/{acta.tlTirados || 0}
                  {'\n'}
                  T2 {acta.t2Anotados || 0}/{acta.t2Tirados || 0} · T3 {acta.triplesAnotados || 0}/{acta.triplesTirados || 0}
                  {'\n'}
                  REB {acta.rebotes || 0} · ROB {acta.robos || 0} · TAP {acta.tapones || 0}
                  {'\n'}
                  PER {acta.perdida || 0} · FALT {acta.falta || 0} · VAL {acta.valoracion || 0} · +/- {acta.plusMinus || 0}
                </Text>
              ))}
              {!loadingActas && playerActas.length === 0 ? <Text style={styles.actaText}>Sin actas disponibles.</Text> : null}
            </ScrollView>
            <Pressable style={styles.closeModalBtn} onPress={() => setShowPlayerActas(false)}>
              <Text style={styles.resultText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showSubstitutionModal} transparent animationType="fade" onRequestClose={() => setShowSubstitutionModal(false)}>
        <View style={styles.overlayBackdrop}>
          <View style={[styles.overlayCard, styles.playerActaCard]}>
            <Text style={styles.overlayTitle}>Sustitución</Text>
            <Text style={styles.actaText}>
              Sale #{String(substitutionTarget?.dorsal || 0).padStart(2, '0')} {substitutionTarget?.nombreCompleto || ''}
            </Text>
            {processingSubstitution ? <ActivityIndicator size="small" color="#FFF" /> : null}
            <ScrollView>
              {benchOptions.map((player) => (
                <Pressable
                  key={`bench-${player.id}`}
                  style={styles.starterRow}
                  onPress={() => handleConfirmSubstitution(player)}
                  disabled={processingSubstitution}
                >
                  <Text style={styles.starterText}>#{String(player.dorsal || 0).padStart(2, '0')} {player.nombreCompleto}</Text>
                </Pressable>
              ))}
              {!processingSubstitution && benchOptions.length === 0 ? (
                <Text style={styles.actaText}>No hay jugadores de banquillo disponibles.</Text>
              ) : null}
            </ScrollView>
            <Pressable
              style={styles.closeModalBtn}
              onPress={() => {
                setShowSubstitutionModal(false);
                setSubstitutionTarget(null);
              }}
            >
              <Text style={styles.resultText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1D39' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { height: 130, flexDirection: 'row', paddingHorizontal: 10, paddingTop: 6, gap: 10 },
  headerTeamBox: {
    flex: 1,
    borderColor: '#2E5A95',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
  },
  awayBox: { alignItems: 'flex-end' },
  teamSideLabel: { color: '#CDE7FF', fontWeight: '800', fontSize: 18 },
  teamLabel: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  teamPoints: { color: '#FFEF8E', fontSize: 34, fontWeight: '900' },
  centerHeaderBox: {
    flex: 1.4,
    borderColor: '#2E5A95',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    justifyContent: 'space-between',
  },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  periodLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 24 },
  clockControlButton: { backgroundColor: '#2D4B72', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  clockControlText: { color: '#FFF', fontWeight: '700' },
  mainClock: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  nextPeriodButton: { backgroundColor: '#2FA656', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  nextPeriodText: { color: '#FFF', fontWeight: '800' },
  possessionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shotClockText: { color: '#9EFCB4', fontWeight: '900', fontSize: 26 },
  smallControlButton: { backgroundColor: '#385E8C', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5 },
  smallControlText: { color: '#FFFFFF', fontWeight: '700' },
  mainContent: { flex: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingBottom: 8 },
  sideZone: { flex: 1, borderWidth: 1, borderColor: '#2E5A95', borderRadius: 12, padding: 8 },
  centerZone: { flex: 1.8, borderWidth: 1, borderColor: '#2E5A95', borderRadius: 12, padding: 8, gap: 8 },
  playersContainer: { gap: 8 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerCard: {
    flex: 1,
    minHeight: 66,
    backgroundColor: '#FFFFFF14',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#5A7CA9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCardSelected: { borderColor: '#7DF79A', backgroundColor: '#153A28' },
  playerNumber: { color: '#FFF', fontWeight: '900', fontSize: 20 },
  playerFouls: { color: '#FFCDD2', fontWeight: '700' },
  playerButtonsCol: { gap: 6 },
  actionMiniButton: { backgroundColor: '#355274', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  verActaButton: { backgroundColor: '#1E7F87' },
  miniButtonText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  shotMap: { flex: 1, gap: 7, justifyContent: 'center' },
  shotRow: { flexDirection: 'row', gap: 7 },
  shotButton: {
    flex: 1,
    minHeight: 60,
    backgroundColor: '#214F7F',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  shotButtonText: { color: '#FFF', fontWeight: '700', textAlign: 'center', fontSize: 12 },
  shotButtonSpacer: { flex: 1 },
  quickActionsRow: { flexDirection: 'row', gap: 8 },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#6A2A82',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  quickActionText: { color: '#FFF', fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: '#000000AA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  overlayCard: {
    width: '90%',
    maxWidth: 760,
    borderRadius: 14,
    backgroundColor: '#102743',
    borderWidth: 1,
    borderColor: '#3D6597',
    padding: 16,
    gap: 10,
  },
  overlayTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  overlayActions: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  resultBtn: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  successBtn: { backgroundColor: '#1D8D4A' },
  failBtn: { backgroundColor: '#B33838' },
  resultText: { color: '#FFF', fontWeight: '800' },
  periodCard: { maxHeight: '92%' },
  periodColumns: { flexDirection: 'row', gap: 12 },
  periodColumn: { flex: 1, maxHeight: 260 },
  periodTeamLabel: { color: '#BBD7F4', fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  starterRow: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#55739A',
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  starterRowSelected: { backgroundColor: '#205137', borderColor: '#75D59A' },
  starterText: { color: '#FFF', fontWeight: '600' },
  startPeriodBtn: { backgroundColor: '#2FA656', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  startPeriodText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  playerActaCard: { maxHeight: '70%' },
  actaText: { color: '#FFF', marginBottom: 6 },
  closeModalBtn: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: '#355274',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
});
