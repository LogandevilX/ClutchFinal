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
  TextInput,
  View,
} from 'react-native';
import MapaCampo from '../components/MapaCampo';
import {
  closeMatch,
  fetchInitialMatchSetup,
  fetchJugadorActas,
  finishPeriod,
  postEventoPartido,
  startPeriod,
} from '../services/PartidoService';

const ZONAS_TRIPLE = ['TripleEsquinaDer', 'TripleEsquinaIz', 'TripleCabecera'];
const EVENTOS_ACCION = ['ROBO', 'REBOTE', 'TAPON', 'PERDIDA'];

const buildPlayersByTeam = (actas = [], side) => {
  const rows = (actas || []).filter((row) => String(row?.equipoSide || '').toLowerCase() === side);
  return rows;
};

const PlayerCard = ({ row, selected, onPress, onSwap, onActa }) => (
  <Pressable style={[styles.playerCard, selected ? styles.playerCardSelected : null]} onPress={() => onPress(row)}>
    <View style={styles.playerTopRow}>
      <Text style={styles.playerNumber}>{String(row?.dorsal ?? '--').padStart(2, '0')}</Text>
      <Pressable style={styles.swapBtn} onPress={() => onSwap(row)}>
        <Text style={styles.swapBtnText}>↔</Text>
      </Pressable>
    </View>
    <Text style={styles.playerName} numberOfLines={1}>{row?.nombreCompleto || 'Jugador'}</Text>
    <Text style={styles.playerFoul}>Faltas: {row?.falta ?? 0}</Text>
    <Pressable style={styles.actaBtn} onPress={() => onActa(row)}>
      <Text style={styles.actaBtnText}>Ver Acta</Text>
    </Pressable>
  </Pressable>
);

export default function PartidoScreen({ match, onGoBack, onSetActiveMatch }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [context, setContext] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [mainSeconds, setMainSeconds] = useState(0);
  const [shotClock, setShotClock] = useState(24);
  const [running, setRunning] = useState(false);
  const [isPeriodEnded, setIsPeriodEnded] = useState(false);
  const [shootModal, setShootModal] = useState(null);
  const [showPossessionModal, setShowPossessionModal] = useState(false);
  const [playerActaModal, setPlayerActaModal] = useState({ visible: false, player: null, loading: false, rows: [] });
  const [clockEditorVisible, setClockEditorVisible] = useState(false);
  const [clockInput, setClockInput] = useState('00:00');
  const [nextPeriodModal, setNextPeriodModal] = useState(false);
  const [selectedStarters, setSelectedStarters] = useState({ local: [], visitante: [] });
  const [endMatchModal, setEndMatchModal] = useState(false);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!match?.id) {
        setError('No se encontró partido seleccionado.');
        setLoading(false);
        return;
      }

      try {
        const data = match?.context || await fetchInitialMatchSetup(match);
        if (!mounted) return;

        const estadoPartido = data?.estadoPartido;
        const partido = estadoPartido?.partido || data?.partido;
        const periodo = partido?.periodoActual || 1;
        const segundosBase = Math.max(0, Math.min(600, Math.round((partido?.minutoActual || 0) * 60)));

        const localId = data?.local?.id;
        const visitId = data?.visitante?.id;

        const actas = (estadoPartido?.actas || []).map((row) => {
          const teamPlayers = String(row?.equipoId) === String(localId) ? data?.local?.jugadoresDisponibles : data?.visitante?.jugadoresDisponibles;
          const player = (teamPlayers || []).find((p) => String(p.id) === String(row?.jugadorId));
          return {
            ...row,
            nombreCompleto: player?.nombreCompleto || 'Jugador',
            equipoSide: String(row?.equipoId) === String(localId) ? 'local' : 'visitante',
          };
        });

        setContext({ ...data, partido: { ...partido, periodoActual: periodo }, actas });
        setMainSeconds(segundosBase);
        setShotClock(24);
        setLoading(false);
        onSetActiveMatch?.({ ...match, context: { ...data, partido: { ...partido, periodoActual: periodo }, actas } });
      } catch (loadError) {
        setError('No se pudo cargar la vista principal del partido.');
        setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [match, onSetActiveMatch]);

  useEffect(() => {
    if (!running || isPeriodEnded) return undefined;

    const intervalId = setInterval(() => {
      setMainSeconds((prev) => {
        const next = prev + 1;
        if (next >= 600) {
          setRunning(false);
          setIsPeriodEnded(true);
          onFinishPeriod();
        }
        return Math.min(next, 600);
      });

      setShotClock((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setShowPossessionModal(true);
          setTimeout(() => setShowPossessionModal(false), 2000);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [running, isPeriodEnded]);

  const periodoActual = context?.partido?.periodoActual || 1;
  const localPlayers = useMemo(() => buildPlayersByTeam(context?.actas, 'local'), [context?.actas]);
  const visitantePlayers = useMemo(() => buildPlayersByTeam(context?.actas, 'visitante'), [context?.actas]);

  const formatClock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const onRegisterAction = async (accion, extra = {}) => {
    if (!selectedPlayer || !context?.partido?.id) return;
    try {
      await postEventoPartido({
        partidoId: context.partido.id,
        equipoId: selectedPlayer.equipoId,
        jugadorId: selectedPlayer.jugadorId,
        accion,
        minuto: Math.floor(mainSeconds / 60),
        periodo: periodoActual,
        ...extra,
      });
    } catch (eventError) {
      Alert.alert('Aviso', 'No se pudo registrar la acción en backend.');
    }
  };

  const onZonePress = (zona) => {
    if (!selectedPlayer) return;
    const action = ZONAS_TRIPLE.includes(zona) ? 'T3' : 'T2';
    setShootModal({ zona, action });
  };

  const onConfirmShot = async (acierto) => {
    if (!shootModal) return;
    await onRegisterAction(shootModal.action, { posicion: shootModal.zona, acierto });
    setShootModal(null);
  };

  const onFinishPeriod = async () => {
    if (!context?.partido?.id) return;
    try {
      await finishPeriod(context.partido.id);
    } catch (finishError) {
      // se permite continuar en cliente
    }
  };

  const onOpenActa = async (player) => {
    setPlayerActaModal({ visible: true, player, loading: true, rows: [] });
    try {
      const rows = await fetchJugadorActas(player.jugadorId);
      setPlayerActaModal({ visible: true, player, loading: false, rows });
    } catch (errorActa) {
      setPlayerActaModal({ visible: true, player, loading: false, rows: [] });
    }
  };

  const applyClockEdit = () => {
    const matchClock = /^([0-9]{1,2}):([0-5][0-9])$/.exec(clockInput.trim());
    if (!matchClock) return;
    const min = Number(matchClock[1]);
    const sec = Number(matchClock[2]);
    const total = Math.min(600, min * 60 + sec);
    setMainSeconds(total);
    setClockEditorVisible(false);
  };

  const toggleStarter = (team, jugadorId) => {
    setSelectedStarters((prev) => {
      const prevList = prev[team] || [];
      const exists = prevList.includes(jugadorId);
      if (exists) {
        return { ...prev, [team]: prevList.filter((id) => id !== jugadorId) };
      }
      if (prevList.length >= 5) {
        return prev;
      }
      return { ...prev, [team]: [...prevList, jugadorId] };
    });
  };

  const onNextPeriod = async (isOvertime = false) => {
    const next = (context?.partido?.periodoActual || 1) + 1;
    const titulares = [
      ...selectedStarters.local.map((jugadorId) => ({ equipoId: context?.local?.id, jugadorId })),
      ...selectedStarters.visitante.map((jugadorId) => ({ equipoId: context?.visitante?.id, jugadorId })),
    ];

    if (titulares.length !== 10) {
      Alert.alert('Titulares incompletos', 'Debes seleccionar 5 titulares por cada equipo.');
      return;
    }

    try {
      await startPeriod({ partidoId: context.partido.id, periodo: next, minuto: 0, titulares });
      setContext((prev) => ({ ...prev, partido: { ...prev.partido, periodoActual: next } }));
      setMainSeconds(0);
      setShotClock(24);
      setIsPeriodEnded(false);
      setRunning(!isOvertime);
      setNextPeriodModal(false);
      setEndMatchModal(false);
      setSelectedStarters({ local: [], visitante: [] });
    } catch (startErr) {
      Alert.alert('Error', 'No fue posible iniciar el siguiente periodo.');
    }
  };

  const onFinalizeMatch = async () => {
    try {
      await closeMatch(context.partido.id);
      onSetActiveMatch?.(null);
      Alert.alert('Partido finalizado', 'Se ha cerrado el partido correctamente.', [{ text: 'Aceptar', onPress: onGoBack }]);
    } catch (closeErr) {
      Alert.alert('Error', 'No se pudo finalizar el partido.');
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#fff" /></SafeAreaView>;
  }

  if (error) {
    return <SafeAreaView style={styles.center}><Text style={styles.errorText}>{error}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.teamScore}><Text style={styles.teamName}>{context?.local?.nombreEquipo}</Text><Text style={styles.score}>{context?.partido?.puntosLocal ?? 0}</Text></View>
        <View style={styles.centerHeader}>
          <Text style={styles.period}>P{periodoActual}</Text>
          <View style={styles.clockRow}>
            <Pressable style={styles.smallBtn} onPress={() => { setClockInput(formatClock(mainSeconds)); setClockEditorVisible(true); }}><Text style={styles.smallBtnText}>✎</Text></Pressable>
            <Text style={styles.clock}>{formatClock(mainSeconds)}</Text>
          </View>
          <Text style={styles.shotClock}>{shotClock}s</Text>
          <View style={styles.controlsRow}>
            <Pressable style={styles.controlBtn} onPress={() => setRunning(false)}><Text style={styles.controlText}>Parar</Text></Pressable>
            <Pressable style={styles.controlBtn} onPress={() => setShotClock(24)}><Text style={styles.controlText}>Reiniciar posesión</Text></Pressable>
            <Pressable style={styles.controlBtn} onPress={() => setShotClock(14)}><Text style={styles.controlText}>14s</Text></Pressable>
          </View>
          {isPeriodEnded ? (
            <Pressable style={styles.nextPeriodBtn} onPress={() => ((periodoActual >= 4) ? setEndMatchModal(true) : setNextPeriodModal(true))}>
              <Text style={styles.nextPeriodText}>Siguiente periodo</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.playBtn} onPress={() => setRunning((prev) => !prev)}><Text style={styles.playText}>{running ? 'Pausar' : 'Iniciar'}</Text></Pressable>
          )}
        </View>
        <View style={styles.teamScore}><Text style={styles.teamName}>{context?.visitante?.nombreEquipo}</Text><Text style={styles.score}>{context?.partido?.puntosVisitante ?? 0}</Text></View>
      </View>

      <View style={styles.body}>
        <ScrollView style={styles.sideCol}>{localPlayers.map((row) => <PlayerCard key={String(row.id)} row={row} selected={selectedPlayer?.id === row.id} onPress={setSelectedPlayer} onSwap={() => {}} onActa={onOpenActa} />)}</ScrollView>
        <View style={styles.centerCol}>
          <MapaCampo disabled={!selectedPlayer} onZonePress={onZonePress} />
          <View style={styles.actionsBar}>
            {EVENTOS_ACCION.map((accion) => (
              <Pressable key={accion} style={[styles.actionBtn, !selectedPlayer ? styles.actionBtnDisabled : null]} disabled={!selectedPlayer} onPress={() => onRegisterAction(accion)}>
                <Text style={styles.actionText}>{accion}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <ScrollView style={styles.sideCol}>{visitantePlayers.map((row) => <PlayerCard key={String(row.id)} row={row} selected={selectedPlayer?.id === row.id} onPress={setSelectedPlayer} onSwap={() => {}} onActa={onOpenActa} />)}</ScrollView>
      </View>

      <Modal visible={Boolean(shootModal)} transparent animationType="fade">
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>Resultado del tiro ({shootModal?.action})</Text>
          <View style={styles.modalRow}><Pressable style={[styles.modalAction, styles.green]} onPress={() => onConfirmShot(true)}><Text style={styles.modalActionText}>ACIERTO</Text></Pressable>
          <Pressable style={[styles.modalAction, styles.red]} onPress={() => onConfirmShot(false)}><Text style={styles.modalActionText}>FALLO</Text></Pressable></View>
        </View></View>
      </Modal>

      <Modal visible={showPossessionModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}><View style={styles.flashCard}><Text style={styles.flashText}>FIN POSESIÓN</Text></View></View>
      </Modal>

      <Modal visible={clockEditorVisible} transparent animationType="fade" onRequestClose={() => setClockEditorVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalTitle}>Editar cronómetro</Text>
          <TextInput style={styles.input} value={clockInput} onChangeText={setClockInput} placeholder="MM:SS" placeholderTextColor="#999" />
          <Pressable style={styles.controlBtn} onPress={applyClockEdit}><Text style={styles.controlText}>Guardar</Text></Pressable>
        </View></View>
      </Modal>

      <Modal visible={playerActaModal.visible} transparent animationType="slide" onRequestClose={() => setPlayerActaModal({ visible: false, player: null, loading: false, rows: [] })}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, { maxHeight: '70%' }]}><Text style={styles.modalTitle}>Actas de {playerActaModal.player?.nombreCompleto}</Text>
          {playerActaModal.loading ? <ActivityIndicator color="#111" /> : (
            <ScrollView>{playerActaModal.rows.map((row) => <Text key={String(row.id)} style={styles.rowText}>Partido {row.partidoId}: PTS {row.puntos || 0}, REB {row.rebotes || 0}, ROBO {row.robos || 0}</Text>)}</ScrollView>
          )}
        </View></View>
      </Modal>

      <Modal visible={nextPeriodModal || endMatchModal} transparent animationType="slide" onRequestClose={() => { setNextPeriodModal(false); setEndMatchModal(false); }}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, { width: '92%', maxWidth: 900 }]}>
          <Text style={styles.modalTitle}>{endMatchModal ? 'Fin de P4' : 'Siguiente periodo'}</Text>
          <View style={styles.modalColumns}>
            <View style={styles.pickCol}><Text style={styles.pickTitle}>Titulares Local</Text>{localPlayers.map((p) => (
              <Pressable key={`l-${p.id}`} style={[styles.pickItem, selectedStarters.local.includes(p.jugadorId) ? styles.pickItemSelected : null]} onPress={() => toggleStarter('local', p.jugadorId)}>
                <Text style={styles.pickText}>{p.nombreCompleto}</Text>
              </Pressable>
            ))}</View>
            <View style={styles.pickCol}><Text style={styles.pickTitle}>Titulares Visitante</Text>{visitantePlayers.map((p) => (
              <Pressable key={`v-${p.id}`} style={[styles.pickItem, selectedStarters.visitante.includes(p.jugadorId) ? styles.pickItemSelected : null]} onPress={() => toggleStarter('visitante', p.jugadorId)}>
                <Text style={styles.pickText}>{p.nombreCompleto}</Text>
              </Pressable>
            ))}</View>
          </View>
          {endMatchModal ? (
            <View style={styles.modalRow}>
              <Pressable style={[styles.modalAction, styles.red]} onPress={onFinalizeMatch}><Text style={styles.modalActionText}>Finalizar Partido</Text></Pressable>
              <Pressable style={[styles.modalAction, styles.green]} onPress={() => onNextPeriod(true)}><Text style={styles.modalActionText}>Prórroga</Text></Pressable>
            </View>
          ) : (
            <Pressable style={[styles.modalAction, styles.green]} onPress={() => onNextPeriod(false)}><Text style={styles.modalActionText}>Confirmar titulares</Text></Pressable>
          )}
        </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8, borderBottomColor: '#333', borderBottomWidth: 1 },
  teamScore: { width: '28%' },
  teamName: { color: '#fff', fontWeight: '800', fontSize: 20 },
  score: { color: '#8BFF8B', fontWeight: '900', fontSize: 38 },
  centerHeader: { width: '44%', alignItems: 'center' },
  period: { color: '#fff', fontWeight: '800', fontSize: 20 },
  clockRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallBtn: { paddingHorizontal: 9, paddingVertical: 4, backgroundColor: '#333', borderRadius: 8 },
  smallBtnText: { color: '#fff' },
  clock: { color: '#fff', fontWeight: '900', fontSize: 34 },
  shotClock: { color: '#FFDE59', fontWeight: '800', fontSize: 22 },
  controlsRow: { flexDirection: 'row', gap: 8 },
  controlBtn: { backgroundColor: '#2E5BFF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  controlText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  playBtn: { marginTop: 8, backgroundColor: '#1FA750', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  playText: { color: '#fff', fontWeight: '800' },
  nextPeriodBtn: { marginTop: 8, backgroundColor: '#F57F17', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  nextPeriodText: { color: '#fff', fontWeight: '800' },
  body: { flex: 1, flexDirection: 'row', padding: 8, gap: 8 },
  sideCol: { width: '22%' },
  centerCol: { width: '56%', backgroundColor: '#1A1A1A', borderRadius: 10, padding: 8 },
  playerCard: { backgroundColor: '#242424', borderRadius: 8, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#3A3A3A' },
  playerCardSelected: { borderColor: '#00E5FF' },
  playerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  playerNumber: { color: '#fff', fontWeight: '900', fontSize: 20 },
  swapBtn: { backgroundColor: '#444', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  swapBtnText: { color: '#fff', fontWeight: '700' },
  playerName: { color: '#fff', fontSize: 12, marginTop: 4 },
  playerFoul: { color: '#FFBDBD', fontSize: 12, marginTop: 4 },
  actaBtn: { marginTop: 6, backgroundColor: '#3E50B4', borderRadius: 6, padding: 6, alignItems: 'center' },
  actaBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actionsBar: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#3949AB', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  actionBtnDisabled: { backgroundColor: '#555' },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000099', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, width: '80%', maxWidth: 480 },
  modalTitle: { fontWeight: '800', fontSize: 20, marginBottom: 12 },
  modalRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  modalAction: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, minWidth: 130, alignItems: 'center' },
  green: { backgroundColor: '#1FA750' },
  red: { backgroundColor: '#D32F2F' },
  modalActionText: { color: '#fff', fontWeight: '800' },
  flashCard: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 14 },
  flashText: { fontWeight: '900', fontSize: 24 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 10, marginBottom: 10 },
  rowText: { marginBottom: 8, color: '#222' },
  modalColumns: { flexDirection: 'row', gap: 10 },
  pickCol: { flex: 1, maxHeight: 240 },
  pickTitle: { fontWeight: '800', marginBottom: 8 },
  pickItem: { backgroundColor: '#E9E9E9', borderRadius: 8, padding: 8, marginBottom: 6 },
  pickItemSelected: { backgroundColor: '#C8E6C9' },
  pickText: { fontWeight: '600' },
});
