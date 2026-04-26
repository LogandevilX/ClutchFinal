import { useEffect, useMemo, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
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
  const actasTeam = (state?.actas || []).filter((acta) => String(acta?.equipoId) === String(teamId));
  const actaPlayerIds = new Set(actasTeam.map((acta) => String(acta?.jugadorId)));
  const allPlayers = [
    ...(setupData?.local?.jugadoresDisponibles || []),
    ...(setupData?.visitante?.jugadoresDisponibles || []),
  ];
  const playerNameById = new Map(
    allPlayers
      .filter((player) => actaPlayerIds.has(String(player?.id)))
      .map((player) => [
        String(player?.id),
        {
          nombreCompleto: player?.nombreCompleto || [player?.nombre, player?.primerApellido].filter(Boolean).join(' ').trim(),
          pathFoto: player?.pathFoto || player?.foto || null,
        },
      ])
  );

  const basePlayers = (setupTeam?.jugadoresDisponibles || [])
    .filter((player) => actaPlayerIds.has(String(player?.id)))
    .map((player) => ({
      ...player,
      equipoId: teamId,
      nombreCompleto: player.nombreCompleto || [player?.nombre, player?.primerApellido].filter(Boolean).join(' ').trim() || 'Nombre jugador',
      pathFoto: player?.pathFoto || player?.foto || null,
    }));

  const rosterFromActas = actasTeam.map((acta) => ({
    id: acta?.jugadorId,
    equipoId: acta?.equipoId,
    nombreCompleto: playerNameById.get(String(acta?.jugadorId))?.nombreCompleto || 'Jugador',
    pathFoto: playerNameById.get(String(acta?.jugadorId))?.pathFoto || null,
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
      <Pressable
        style={({ pressed }) => [styles.playerCard, isSelected ? styles.playerCardSelected : null, pressed ? styles.buttonPressed : null]}
        onPress={onSelect}
      >
        <Text style={styles.playerNumber}>#{String(player?.dorsal || 0).padStart(2, '0')}</Text>
        <Text style={styles.playerFouls}>Faltas: {player?.falta || 0}</Text>
      </Pressable>

      <View style={styles.playerButtonsCol}>
        <Pressable style={({ pressed }) => [styles.actionMiniButton, pressed ? styles.buttonPressed : null]} onPress={onSub}>
          <Text style={styles.subButtonText}>⇄</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionMiniButton, styles.verActaButton, pressed ? styles.buttonPressed : null]}
          onPress={onShowActa}
        >
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
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  const [editClockValue, setEditClockValue] = useState(0);
  const [timeoutActive, setTimeoutActive] = useState(false);
  const [timeoutRemaining, setTimeoutRemaining] = useState(60);
  const [timeoutTeam, setTimeoutTeam] = useState('');
  const [showFoulModal, setShowFoulModal] = useState(false);
  const [foulStep, setFoulStep] = useState('type');
  const [foulShooter, setFoulShooter] = useState(null);
  const [freeThrowsTotal, setFreeThrowsTotal] = useState(0);
  const [freeThrowsTaken, setFreeThrowsTaken] = useState(0);
  const [forcedSubstitution, setForcedSubstitution] = useState(false);

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

  const foulShooterOptions = useMemo(() => {
    if (!selectedPlayer?.side) return [];
    return selectedPlayer.side === 'local' ? awayPlayersOnCourt : localPlayersOnCourt;
  }, [selectedPlayer?.side, awayPlayersOnCourt, localPlayersOnCourt]);

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
    if (!partidoId) return;
    setLocalRoster(buildRosterFromState(state, setupData, 'local'));
    setAwayRoster(buildRosterFromState(state, setupData, 'visitante'));
  }, [state, setupData, partidoId]);

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
    if (!timeoutActive) return undefined;

    const timeoutInterval = setInterval(() => {
      setTimeoutRemaining((prev) => {
        if (prev <= 1) {
          setTimeoutActive(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timeoutInterval);
  }, [timeoutActive]);

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

  useEffect(() => {
    const playerWithFiveFouls = [
      ...localPlayersOnCourt.map((player) => ({ ...player, side: 'local', equipoId: teamLocal?.id })),
      ...awayPlayersOnCourt.map((player) => ({ ...player, side: 'visitante', equipoId: teamVisitante?.id })),
    ].find((player) => Number(player?.falta || 0) >= 5);

    if (!playerWithFiveFouls) return;
    if (showSubstitutionModal && substitutionTarget?.id === playerWithFiveFouls.id) return;

    setSubstitutionTarget(playerWithFiveFouls);
    setForcedSubstitution(true);
    setShowSubstitutionModal(true);
    setClockRunning(false);
  }, [
    localPlayersOnCourt,
    awayPlayersOnCourt,
    showSubstitutionModal,
    substitutionTarget?.id,
    teamLocal?.id,
    teamVisitante?.id,
  ]);

  const minute = Math.floor(mainClock / 60);
  const second = mainClock % 60;
  const editMinute = Math.floor(editClockValue / 60);
  const editSecond = editClockValue % 60;

  const adjustEditClock = (delta) => {
    setEditClockValue((previous) => {
      const next = previous + delta;
      if (next < 0) return 0;
      if (next > 600) return 600;
      return next;
    });
  };

  const handleOpenEditTime = () => {
    clearSelectedPlayer();
    setClockRunning(false);
    setEditClockValue(mainClock);
    setShowEditTimeModal(true);
  };

  const handleApplyEditedTime = () => {
    setMainClock(editClockValue);
    setShowEditTimeModal(false);
  };

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

  const stopAndOpenFoul = () => {
    if (!selectedPlayer?.id) return;
    setClockRunning(false);
    setShowFoulModal(true);
    setFoulStep('type');
    setFoulShooter(null);
    setFreeThrowsTotal(0);
    setFreeThrowsTaken(0);
  };

  const handleNormalFoul = async (closeModal = true) => {
    try {
      const updated = await sendEvent(partidoId, {
        equipoId: selectedPlayer.equipoId,
        jugadorId: selectedPlayer.id,
        tipoEvento: 'FALTA',
        periodo: currentPeriod,
        minuto: minute,
        segundo: second,
      });
      setState(updated);
      if (closeModal) {
        setShowFoulModal(false);
      }
      return updated;
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la falta.');
      return null;
    }
  };

  const handleFreeThrowResult = async (isSuccess) => {
    if (!foulShooter?.id || freeThrowsTaken >= freeThrowsTotal) {
      return;
    }
    try {
      const updated = await sendEvent(partidoId, {
        equipoId: foulShooter.equipoId,
        jugadorId: foulShooter.id,
        tipoEvento: 'TL',
        acierto: isSuccess ? 'SI' : 'NO',
        periodo: currentPeriod,
        minuto: minute,
        segundo: second,
      });
      setState(updated);

      if (freeThrowsTaken + 1 >= freeThrowsTotal) {
        setShowFoulModal(false);
      }
      setFreeThrowsTaken((prev) => prev + 1);
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el tiro libre.');
    }
  };

  const handleStartTimeout = async (side) => {
    const equipoId = side === 'local' ? teamLocal?.id : teamVisitante?.id;
    if (!equipoId) return;

    setClockRunning(false);
    setTimeoutRemaining(60);
    setTimeoutTeam(side);
    setTimeoutActive(true);

    try {
      const updated = await sendEvent(partidoId, {
        equipoId,
        tipoEvento: 'TIEMPO_MUERTO',
        periodo: currentPeriod,
        minuto: minute,
        segundo: second,
      });
      setState(updated);
      return updated;
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el tiempo muerto.');
      return null;
    }
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
      setForcedSubstitution(false);
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
          <Pressable
            style={({ pressed }) => [styles.timeoutButton, styles.timeoutButtonLocal, pressed ? styles.buttonPressed : null]}
            onPress={() => handleStartTimeout('local')}
          >
            <Text style={styles.timeoutButtonText}>TM</Text>
          </Pressable>
          <Text style={styles.teamLabel}>{teamLocal?.nombreEquipo || 'Local'}</Text>
          <Text style={styles.teamPoints}>{teamPoints.local}</Text>
        </View>

        <View style={styles.centerHeaderBox}>
          <View style={styles.periodRow}>
            <Text style={styles.periodLabel}>P{currentPeriod}</Text>
            <Pressable
              style={({ pressed }) => [styles.clockControlButton, pressed ? styles.buttonPressed : null]}
              onPress={handleOpenEditTime}
            >
              <Text style={styles.clockControlText}>Editar</Text>
            </Pressable>
            {mainClock >= 600 && !isFourthFinished ? (
              <Pressable
                style={({ pressed }) => [styles.nextPeriodButton, pressed ? styles.buttonPressed : null]}
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
          {timeoutActive ? (
            <Text style={styles.timeoutCounter}>⏱ TM {timeoutTeam === 'local' ? 'Local' : 'Visitante'} · {formatClock(timeoutRemaining)}</Text>
          ) : null}

          <View style={styles.possessionRow}>
            <Pressable
              style={({ pressed }) => [styles.smallControlButton, pressed ? styles.buttonPressed : null]}
              onPress={() => {
                clearSelectedPlayer();
                setShotClock(24);
              }}
            >
              <Text style={styles.smallControlText}>↺24</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.smallControlButton, pressed ? styles.buttonPressed : null]}
              onPress={() => {
                clearSelectedPlayer();
                if (timeoutActive) {
                  return;
                }
                setClockRunning((prev) => !prev);
              }}
            >
              <Text style={styles.smallControlText}>{clockRunning ? 'Pausa' : 'Play'}</Text>
            </Pressable>
            <Text style={styles.shotClockText}>{shotClock} - 0</Text>
            <Pressable
              style={({ pressed }) => [styles.smallControlButton, pressed ? styles.buttonPressed : null]}
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
          <Pressable
            style={({ pressed }) => [styles.timeoutButton, styles.timeoutButtonAway, pressed ? styles.buttonPressed : null]}
            onPress={() => handleStartTimeout('visitante')}
          >
            <Text style={styles.timeoutButtonText}>TM</Text>
          </Pressable>
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
                      style={({ pressed }) => [styles.shotButton, !selectedPlayer?.id ? styles.disabledButton : null, pressed ? styles.buttonPressed : null]}
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
                style={({ pressed }) => [styles.quickActionBtn, !selectedPlayer?.id ? styles.disabledButton : null, pressed ? styles.buttonPressed : null]}
                onPress={() => handleQuickAction(action)}
                disabled={!selectedPlayer?.id}
              >
                <Text style={styles.quickActionText}>{action}</Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.quickActionBtn, styles.foulActionBtn, !selectedPlayer?.id ? styles.disabledButton : null, pressed ? styles.buttonPressed : null]}
              onPress={stopAndOpenFoul}
              disabled={!selectedPlayer?.id}
            >
              <Text style={styles.quickActionText}>FALTA</Text>
            </Pressable>
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
              <Pressable style={({ pressed }) => [styles.resultBtn, styles.successBtn, pressed ? styles.buttonPressed : null]} onPress={() => handleShotResult(true)}>
                <Text style={styles.resultText}>ACIERTO</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.resultBtn, styles.failBtn, pressed ? styles.buttonPressed : null]} onPress={() => handleShotResult(false)}>
                <Text style={styles.resultText}>Fallo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditTimeModal} transparent animationType="fade" onRequestClose={() => setShowEditTimeModal(false)}>
        <View style={styles.overlayBackdrop}>
          <View style={[styles.overlayCard, styles.editTimeCard]}>
            <Text style={styles.overlayTitle}>Editar tiempo</Text>

            <Text style={styles.editTimeMainClock}>{formatClock(editClockValue)} - 10:00</Text>

            <View style={styles.editTimeControlsRow}>
              <View style={styles.editTimeValueBlock}>
                <Text style={styles.editTimeValueLabel}>Minutos</Text>
                <Text style={styles.editTimeValueText}>{String(editMinute).padStart(2, '0')}</Text>
              </View>
              <View style={styles.editTimeArrowColumn}>
                <Pressable style={({ pressed }) => [styles.smallControlButton, pressed ? styles.buttonPressed : null]} onPress={() => adjustEditClock(60)}>
                  <Text style={styles.smallControlText}>▲</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.smallControlButton, pressed ? styles.buttonPressed : null]} onPress={() => adjustEditClock(-60)}>
                  <Text style={styles.smallControlText}>▼</Text>
                </Pressable>
              </View>

              <Text style={styles.editTimeSeparator}>:</Text>

              <View style={styles.editTimeValueBlock}>
                <Text style={styles.editTimeValueLabel}>Segundos</Text>
                <Text style={styles.editTimeValueText}>{String(editSecond).padStart(2, '0')}</Text>
              </View>
              <Pressable style={({ pressed }) => [styles.smallControlButton, pressed ? styles.buttonPressed : null]} onPress={() => adjustEditClock(10)}>
                <Text style={styles.smallControlText}>+10s</Text>
              </Pressable>
              <View style={styles.editTimeArrowColumn}>
                <Pressable style={({ pressed }) => [styles.smallControlButton, pressed ? styles.buttonPressed : null]} onPress={() => adjustEditClock(1)}>
                  <Text style={styles.smallControlText}>▲</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.smallControlButton, pressed ? styles.buttonPressed : null]} onPress={() => adjustEditClock(-1)}>
                  <Text style={styles.smallControlText}>▼</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.overlayActions}>
              <Pressable style={({ pressed }) => [styles.closeModalBtn, pressed ? styles.buttonPressed : null]} onPress={() => setShowEditTimeModal(false)}>
                <Text style={styles.resultText}>Cancelar</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.closeModalBtn, styles.applyTimeBtn, pressed ? styles.buttonPressed : null]} onPress={handleApplyEditedTime}>
                <Text style={styles.resultText}>Aplicar</Text>
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
                      style={({ pressed }) => [
                        styles.starterRow,
                        nextPeriodStarters.local.includes(player.id) ? styles.starterRowSelected : null,
                        pressed ? styles.buttonPressed : null,
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
                      style={({ pressed }) => [
                        styles.starterRow,
                        nextPeriodStarters.visitante.includes(player.id) ? styles.starterRowSelected : null,
                        pressed ? styles.buttonPressed : null,
                      ]}
                      onPress={() => handleAddStarter('visitante', player.id)}
                    >
                      <Text style={styles.starterText}>#{String(player.dorsal).padStart(2, '0')} {player.nombreCompleto}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Pressable style={({ pressed }) => [styles.startPeriodBtn, pressed ? styles.buttonPressed : null]} onPress={handleStartNextPeriod}>
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
              <Pressable style={({ pressed }) => [styles.resultBtn, styles.failBtn, pressed ? styles.buttonPressed : null]} onPress={handleFinishMatch}>
                <Text style={styles.resultText}>Finalizar partido</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.resultBtn, styles.successBtn, pressed ? styles.buttonPressed : null]} onPress={() => setShowPeriodModal(true)}>
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
                <View key={String(acta.id)} style={styles.actaRowCard}>
                  <View style={styles.actaColumn}>
                    <Text style={styles.actaMetric}>MIN: {acta.minutosJugados || 0}</Text>
                    <Text style={styles.actaMetric}>PTS: {acta.puntos || 0}</Text>
                    <Text style={styles.actaMetric}>TL: {acta.tlAnotados || 0}/{acta.tlTirados || 0}</Text>
                    <Text style={styles.actaMetric}>T2: {acta.t2Anotados || 0}/{acta.t2Tirados || 0}</Text>
                  </View>
                  <View style={styles.actaColumn}>
                    <Text style={styles.actaMetric}>T3: {acta.triplesAnotados || 0}/{acta.triplesTirados || 0}</Text>
                    <Text style={styles.actaMetric}>REB: {acta.rebotes || 0}</Text>
                    <Text style={styles.actaMetric}>ROB: {acta.robos || 0} · TAP: {acta.tapones || 0}</Text>
                    <Text style={styles.actaMetric}>PER: {acta.perdida || 0} · FALT: {acta.falta || 0}</Text>
                    <Text style={styles.actaMetric}>VAL: {acta.valoracion || 0} · +/-: {acta.plusMinus || 0}</Text>
                  </View>
                </View>
              ))}
              {!loadingActas && playerActas.length === 0 ? <Text style={styles.actaText}>Sin actas disponibles.</Text> : null}
            </ScrollView>
            <Pressable style={({ pressed }) => [styles.closeModalBtn, pressed ? styles.buttonPressed : null]} onPress={() => setShowPlayerActas(false)}>
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
                  style={({ pressed }) => [styles.starterRow, pressed ? styles.buttonPressed : null]}
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
              style={({ pressed }) => [styles.closeModalBtn, pressed ? styles.buttonPressed : null]}
              onPress={() => {
                if (forcedSubstitution) {
                  Alert.alert('Sustitución obligatoria', 'Un jugador con 5 faltas debe ser sustituido.');
                  return;
                }
                setShowSubstitutionModal(false);
                setSubstitutionTarget(null);
              }}
            >
              <Text style={styles.resultText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showFoulModal} transparent animationType="fade" onRequestClose={() => setShowFoulModal(false)}>
        <View style={styles.overlayBackdrop}>
          <View style={[styles.overlayCard, styles.playerActaCard]}>
            <Text style={styles.overlayTitle}>Registro de falta</Text>
            {foulStep === 'type' ? (
              <>
                <Text style={styles.actaText}>¿Tipo de falta?</Text>
                <View style={styles.overlayActions}>
                  <Pressable style={({ pressed }) => [styles.resultBtn, styles.failBtn, pressed ? styles.buttonPressed : null]} onPress={handleNormalFoul}>
                    <Text style={styles.resultText}>Normal</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.resultBtn, styles.successBtn, pressed ? styles.buttonPressed : null]}
                    onPress={async () => {
                      const foulRegistered = await handleNormalFoul(false);
                      if (foulRegistered) {
                        setFoulStep('shooter');
                      }
                    }}
                  >
                    <Text style={styles.resultText}>De tiro</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {foulStep === 'shooter' ? (
              <>
                <Text style={styles.actaText}>Selecciona al tirador del equipo contrario:</Text>
                <ScrollView>
                  {foulShooterOptions.map((player) => (
                    <Pressable
                      key={`shooter-${player.id}`}
                      style={({ pressed }) => [styles.starterRow, pressed ? styles.buttonPressed : null]}
                      onPress={() => {
                        setFoulShooter(player);
                        setFoulStep('count');
                      }}
                    >
                      <Text style={styles.starterText}>#{String(player.dorsal || 0).padStart(2, '0')} {player.nombreCompleto}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            {foulStep === 'count' ? (
              <>
                <Text style={styles.actaText}>Cantidad de tiros libres</Text>
                <View style={styles.overlayActions}>
                  {[1, 2, 3].map((count) => (
                    <Pressable
                      key={`ft-${count}`}
                      style={({ pressed }) => [styles.resultBtn, styles.clockControlButton, pressed ? styles.buttonPressed : null]}
                      onPress={() => {
                        setFreeThrowsTotal(count);
                        setFreeThrowsTaken(0);
                        setFoulStep('result');
                      }}
                    >
                      <Text style={styles.resultText}>{count}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {foulStep === 'result' ? (
              <>
                <Text style={styles.actaText}>
                  Tiro libre {freeThrowsTaken + 1} de {freeThrowsTotal}
                </Text>
                <View style={styles.overlayActions}>
                  <Pressable style={({ pressed }) => [styles.resultBtn, styles.successBtn, pressed ? styles.buttonPressed : null]} onPress={() => handleFreeThrowResult(true)}>
                    <Text style={styles.resultText}>Acierto</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.resultBtn, styles.failBtn, pressed ? styles.buttonPressed : null]} onPress={() => handleFreeThrowResult(false)}>
                    <Text style={styles.resultText}>Fallo</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
            <Pressable style={({ pressed }) => [styles.closeModalBtn, pressed ? styles.buttonPressed : null]} onPress={() => setShowFoulModal(false)}>
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
    position: 'relative',
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
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  playerButtonsCol: { gap: 8 },
  actionMiniButton: {
    backgroundColor: '#355274',
    borderRadius: 10,
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verActaButton: { backgroundColor: '#1E7F87' },
  miniButtonText: { color: '#FFF', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 16 },
  subButtonText: { color: '#FFF', fontSize: 24, fontWeight: '900', lineHeight: 24 },
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
  foulActionBtn: { backgroundColor: '#8E2C2C' },
  disabledButton: { opacity: 0.45 },
  buttonPressed: { opacity: 0.75 },
  timeoutButton: {
    position: 'absolute',
    top: 8,
    backgroundColor: '#2D4B72',
    borderRadius: 10,
    minWidth: 52,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  timeoutButtonLocal: { right: 8 },
  timeoutButtonAway: { left: 8 },
  timeoutButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  timeoutCounter: { color: '#FFE290', fontWeight: '800', textAlign: 'center', marginTop: -2 },
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
  editTimeCard: { maxWidth: 680 },
  editTimeMainClock: { color: '#FFF', fontSize: 36, fontWeight: '900', textAlign: 'center', marginVertical: 8 },
  editTimeControlsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  editTimeValueBlock: { alignItems: 'center', minWidth: 86 },
  editTimeValueLabel: { color: '#BBD7F4', fontWeight: '700', fontSize: 12 },
  editTimeValueText: { color: '#FFF', fontWeight: '900', fontSize: 30 },
  editTimeSeparator: { color: '#FFF', fontSize: 34, fontWeight: '900', marginHorizontal: 2 },
  editTimeArrowColumn: { gap: 6 },
  applyTimeBtn: { backgroundColor: '#2FA656' },
  actaText: { color: '#FFF', marginBottom: 6 },
  actaRowCard: {
    borderWidth: 1,
    borderColor: '#55739A',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#163458',
  },
  actaColumn: { flex: 1, gap: 4 },
  actaMetric: { color: '#E3F1FF', fontSize: 13, fontWeight: '600' },
  closeModalBtn: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: '#355274',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
});
