import { useEffect, useMemo, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  fetchInitialMatchSetup,
  formatTimeUntilStart,
  initializeActa,
  startFirstPeriod,
} from '../services/PartidoService';

const appLogo = require('../assets/LogoClutch.png');

const TeamSection = ({ sideLabel, team, selectedPlayers, onOpenPicker, onRemovePlayer }) => (
  <View style={styles.teamSection}>
    <Text style={styles.sideLabel}>{sideLabel}</Text>

    <View style={styles.teamHeader}>
      <Image
        source={team?.urlEscudo ? { uri: team.urlEscudo } : appLogo}
        style={styles.teamLogo}
        resizeMode="contain"
      />
      <Text style={styles.teamName}>{team?.nombreEquipo || 'Equipo'}</Text>
    </View>

    <View style={styles.coachRow}>
      <Text style={styles.coachText}>1º Entrenador: {team?.coaches?.firstCoach || 'Sin asignar'}</Text>
      <Text style={styles.coachText}>2º Entrenador: {team?.coaches?.secondCoach || 'Sin asignar'}</Text>
    </View>

    <View style={styles.playersBox}>
      <View style={styles.playersHeader}>
        <Text style={styles.playersTitle}>Convocados ({selectedPlayers.length}/12)</Text>
        <Pressable style={styles.addButton} onPress={onOpenPicker}>
          <Text style={styles.addButtonIcon}>👕+</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.playersList}>
        {selectedPlayers.length === 0 ? <Text style={styles.emptyList}>Todavía no hay jugadores añadidos.</Text> : null}

        {selectedPlayers.map((row) => (
          <View key={String(row.jugadorId)} style={styles.playerRow}>
            <Text style={styles.playerName}>#{String(row.dorsal).padStart(2, '0')} · {row.nombreCompleto}</Text>
            <View style={styles.playerActions}>
              <Text style={[styles.playerRole, row.titular ? styles.playerRoleStarter : null]}>
                {row.titular ? 'TITULAR' : 'NO TITULAR'}
              </Text>
              <Pressable style={styles.removePlayerButton} onPress={() => onRemovePlayer(row.jugadorId)}>
                <Text style={styles.removePlayerText}>Quitar</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  </View>
);

export default function IniciarPartidoScreen({ partido, onGoBack }) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [setupData, setSetupData] = useState(null);
  const [pickerTeam, setPickerTeam] = useState(null);
  const [localConvocados, setLocalConvocados] = useState([]);
  const [visitanteConvocados, setVisitanteConvocados] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [dorsalInput, setDorsalInput] = useState('');
  const [isStarter, setIsStarter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());

  useEffect(() => {
    const lockLandscape = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (error) {
        // Ignorado: si el dispositivo no soporta bloqueo de orientación, la pantalla sigue disponible.
      }
    };

    lockLandscape();

    return () => {
      ScreenOrientation.unlockAsync().catch(() => {
        // Ignorado en limpieza.
      });
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!partido?.id) {
        setErrorMessage('No se recibió el partido a iniciar.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchInitialMatchSetup(partido);

        if (!mounted) {
          return;
        }

        setSetupData(data);
      } catch (error) {
        if (mounted) {
          setErrorMessage('No se pudieron cargar los datos para iniciar el partido.');
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
  }, [partido]);

  useEffect(() => {
    if (!setupData?.partido?.fechaHoraInicio || loading || errorMessage) {
      return undefined;
    }

    setCurrentTimeMs(Date.now());

    const intervalId = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [setupData?.partido?.fechaHoraInicio, loading, errorMessage]);

  const canStart = localConvocados.length > 0 && visitanteConvocados.length > 0;

  const remainingTimeLabel = useMemo(
    () => formatTimeUntilStart(setupData?.partido?.fechaHoraInicio, currentTimeMs),
    [setupData?.partido?.fechaHoraInicio, currentTimeMs]
  );

  const openPlayerPicker = (teamSide) => {
    setPickerTeam(teamSide);
    setSelectedCandidate(null);
    setDorsalInput('');
    setIsStarter(false);
  };

  const closePlayerPicker = () => {
    setPickerTeam(null);
    setSelectedCandidate(null);
    setDorsalInput('');
    setIsStarter(false);
  };

  const selectedList = pickerTeam === 'local' ? localConvocados : visitanteConvocados;
  const candidates = useMemo(() => {
    if (!setupData || !pickerTeam) {
      return [];
    }

    const selectedIds = new Set(selectedList.map((row) => row.jugadorId));
    const source = pickerTeam === 'local' ? setupData.local?.jugadoresDisponibles : setupData.visitante?.jugadoresDisponibles;
    return (source || []).filter((player) => !selectedIds.has(player.id));
  }, [pickerTeam, selectedList, setupData]);

  const onConfirmAddPlayer = () => {
    if (!selectedCandidate?.id) {
      Alert.alert('Selecciona un jugador', 'Debes elegir un jugador antes de añadirlo.');
      return;
    }

    const dorsal = String(dorsalInput).trim();

    if (!/^\d{1,2}$/.test(dorsal)) {
      Alert.alert('Dorsal inválido', 'El dorsal debe tener como máximo 2 dígitos numéricos.');
      return;
    }

    if (selectedList.length >= 12) {
      Alert.alert('Límite alcanzado', 'Solo se puede añadir un máximo de 12 jugadores por equipo.');
      return;
    }

    const starterCount = selectedList.filter((row) => row.titular).length;
    if (isStarter && starterCount >= 5) {
      Alert.alert('Titulares completos', 'Solo se puede añadir un máximo de 5 titulares por equipo.');
      return;
    }

    const normalizedDorsal = dorsal.padStart(2, '0');

    if (selectedList.some((row) => String(row.dorsal).padStart(2, '0') === normalizedDorsal)) {
      Alert.alert('Dorsal repetido', 'Ese dorsal ya está en uso en este equipo.');
      return;
    }

    const newRow = {
      jugadorId: selectedCandidate.id,
      dorsal: normalizedDorsal,
      titular: isStarter,
      nombreCompleto: selectedCandidate.nombreCompleto,
    };

    if (pickerTeam === 'local') {
      setLocalConvocados((previous) => [...previous, newRow]);
    } else {
      setVisitanteConvocados((previous) => [...previous, newRow]);
    }

    closePlayerPicker();
  };

  const onRemovePlayer = (teamSide, jugadorId) => {
    if (teamSide === 'local') {
      setLocalConvocados((previous) => previous.filter((row) => row.jugadorId !== jugadorId));
      return;
    }

    setVisitanteConvocados((previous) => previous.filter((row) => row.jugadorId !== jugadorId));
  };

  const onStartMatch = async () => {
    if (!setupData?.partido?.id || !canStart) {
      return;
    }

    try {
      setSubmitting(true);

      const acta = await initializeActa({
        partidoId: setupData.partido.id,
        equipoLocalId: setupData.local.id,
        equipoVisitanteId: setupData.visitante.id,
        localConvocados,
        visitanteConvocados,
      });

      await startFirstPeriod({
        partidoId: setupData.partido.id,
        actaId: acta?.id || null,
      });

      Alert.alert('Partido iniciado', 'Acta inicializada y primer periodo iniciado (periodo 1, minuto 0).', [
        { text: 'Aceptar', onPress: onGoBack },
      ]);
    } catch (error) {
      Alert.alert('No se pudo iniciar', 'No fue posible inicializar el acta o arrancar el primer periodo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Inicialización de acta</Text>
      </View>

      {loading ? (
        <View style={styles.centerMessage}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : null}

      {!loading && errorMessage ? (
        <View style={styles.centerMessage}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {!loading && !errorMessage && setupData ? (
        <View style={styles.mainRow}>
          <TeamSection
            sideLabel="Equipo local"
            team={setupData.local}
            selectedPlayers={localConvocados}
            onOpenPicker={() => openPlayerPicker('local')}
            onRemovePlayer={(jugadorId) => onRemovePlayer('local', jugadorId)}
          />

          <View style={styles.centerSection}>
            <Text style={styles.startLabel}>
              Inicio: {new Date(setupData.partido?.fechaHoraInicio || '').toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.remainingLabel}>{remainingTimeLabel}</Text>

            <Pressable
              style={[styles.startButton, !canStart || submitting ? styles.startButtonDisabled : null]}
              onPress={onStartMatch}
              disabled={!canStart || submitting}
            >
              <Text style={styles.startButtonText}>{submitting ? 'Inicializando...' : 'Iniciar partido'}</Text>
            </Pressable>
          </View>

          <TeamSection
            sideLabel="Equipo visitante"
            team={setupData.visitante}
            selectedPlayers={visitanteConvocados}
            onOpenPicker={() => openPlayerPicker('visitante')}
            onRemovePlayer={(jugadorId) => onRemovePlayer('visitante', jugadorId)}
          />
        </View>
      ) : null}

      <Modal visible={Boolean(pickerTeam)} transparent animationType="fade" onRequestClose={closePlayerPicker}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Añadir jugador</Text>
            <Text style={styles.modalHint}>Selecciona un jugador, dorsal y si será titular.</Text>

            <ScrollView style={styles.candidateList}>
              {candidates.map((candidate) => (
                <Pressable
                  key={String(candidate.id)}
                  style={[styles.candidateRow, selectedCandidate?.id === candidate.id ? styles.candidateRowSelected : null]}
                  onPress={() => setSelectedCandidate(candidate)}
                >
                  <Text style={styles.candidateText}>{candidate.nombreCompleto}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <TextInput
              style={styles.dorsalInput}
              placeholder="Dorsal (máx. 2 dígitos)"
              placeholderTextColor="#9EA7B8"
              keyboardType="numeric"
              value={dorsalInput}
              onChangeText={(text) => setDorsalInput(text.replace(/[^0-9]/g, '').slice(0, 2))}
              maxLength={2}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{isStarter ? 'TITULAR' : 'NO TITULAR'}</Text>
              <Switch value={isStarter} onValueChange={setIsStarter} />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={closePlayerPicker}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={onConfirmAddPlayer}>
                <Text style={styles.modalButtonText}>Añadir</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A2540' },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  centerMessage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#FFD8D8', fontWeight: '700' },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  teamSection: {
    flex: 1,
    backgroundColor: '#FFFFFF0F',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    borderRadius: 14,
    padding: 12,
  },
  sideLabel: { color: '#96E0FF', fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  teamHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  teamLogo: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF' },
  teamName: { color: '#FFF', fontSize: 18, fontWeight: '800', flexShrink: 1 },
  coachRow: { marginBottom: 12 },
  coachText: { color: '#E7ECF3', fontWeight: '600', marginBottom: 4 },
  playersBox: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#58779E', padding: 10 },
  playersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playersTitle: { color: '#FFF', fontWeight: '700' },
  addButton: { backgroundColor: '#1D8D4A', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  addButtonIcon: { color: '#FFF', fontWeight: '700' },
  playersList: { paddingVertical: 8, gap: 8 },
  emptyList: { color: '#C9D7E8', fontStyle: 'italic' },
  playerRow: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF14',
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  playerName: { color: '#FFF', fontWeight: '600', flex: 1 },
  playerActions: { alignItems: 'flex-end', gap: 6 },
  playerRole: {
    color: '#CFD8E6',
    fontSize: 12,
    fontWeight: '700',
  },
  playerRoleStarter: { color: '#86F2A1' },
  removePlayerButton: {
    backgroundColor: '#A83B3B',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removePlayerText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  centerSection: {
    width: 230,
    backgroundColor: '#FFFFFF10',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  startLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  remainingLabel: { color: '#C8E1F7', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  startButton: {
    backgroundColor: '#2FA656',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  startButtonDisabled: { backgroundColor: '#4E6C56' },
  startButtonText: { color: '#FFF', fontWeight: '800', textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000000AA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '95%',
    maxWidth: 520,
    backgroundColor: '#F7FAFF',
    borderRadius: 14,
    padding: 16,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  modalHint: { marginTop: 4, marginBottom: 10, color: '#374151' },
  candidateList: { maxHeight: 230, marginBottom: 10 },
  candidateRow: {
    borderWidth: 1,
    borderColor: '#C2CEDD',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  candidateRowSelected: { borderColor: '#1D4ED8', backgroundColor: '#E3EDFF' },
  candidateText: { color: '#111827', fontWeight: '600' },
  dorsalInput: {
    borderWidth: 1,
    borderColor: '#C2CEDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#111827',
    fontWeight: '600',
  },
  switchRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontWeight: '700', color: '#111827' },
  modalActions: { marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { backgroundColor: '#95A4B8', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  confirmButton: { backgroundColor: '#2FA656', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  modalButtonText: { color: '#FFF', fontWeight: '800' },
});
