import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchPartidosAsignados } from '../services/mesaService';

const backgroundImage = require('../assets/Fondo_Mesa.png');
const appLogo = require('../assets/LogoClutch.png');

export default function InicioMesaScreen({ user, onGoProfile, onGoStartMatch, onGoCurrentMatch }) {
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadPartidos = async () => {
      if (!user?.id) {
        setErrorMessage('No se pudo identificar al anotador.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const partidosAsignados = await fetchPartidosAsignados(user.id);

        if (!mounted) {
          return;
        }

        setPartidos(partidosAsignados);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setErrorMessage('No se pudieron cargar tus partidos asignados.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPartidos();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerLeft} onPress={onGoProfile}>
            <Image source={appLogo} style={styles.appLogo} />
            <Text style={styles.userName}>{user?.apodo || 'Usuario'}</Text>
          </Pressable>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.title}>Hola {user?.apodo || 'Usuario'},</Text>
          <Text style={styles.subtitle}>estos son tus partidos:</Text>

          {loading ? (
            <View style={styles.centerMessageBox}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.helperText}>Cargando tus partidos...</Text>
            </View>
          ) : null}

          {!loading && errorMessage ? (
            <View style={styles.centerMessageBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {!loading && !errorMessage ? (
            <ScrollView contentContainerStyle={styles.matchesList} showsVerticalScrollIndicator={false}>
              {partidos.length === 0 ? (
                <Text style={styles.emptyText}>No tienes partidos asignados por ahora.</Text>
              ) : null}

              {partidos.map((partido) => (
                <Pressable
                  key={String(partido.id)}
                  style={styles.matchCard}
                  onPress={() => {
                    if (partido?.estado === 'EN_CURSO') {
                      onGoCurrentMatch?.(partido);
                      return;
                    }
                    setSelectedMatch(partido);
                  }}
                >
                  <Text style={styles.matchTitle}>{partido.local} vs {partido.visitante}</Text>
                  <Text style={styles.matchInfo}>📅 {partido.fechaHora}</Text>
                  <Text style={styles.matchInfo}>📍 {partido.pabellon}</Text>
                  <Text style={styles.matchStatus}>{partido.estado}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </View>

        <Modal
          visible={Boolean(selectedMatch)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMatch(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>¿Deseas iniciar este partido?</Text>
              <Text style={styles.modalText}>
                {selectedMatch?.local} vs {selectedMatch?.visitante}
              </Text>

              <View style={styles.modalActions}>
                <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={() => setSelectedMatch(null)}>
                  <Text style={styles.modalButtonText}>No</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalConfirm]}
                  onPress={() => {
                    const match = selectedMatch;
                    setSelectedMatch(null);
                    onGoStartMatch?.(match);
                  }}
                >
                  <Text style={styles.modalButtonText}>Sí, iniciar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: '80%',
  },
  appLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  userName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },
  contentCard: {
    flex: 1,
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
  },
  centerMessageBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  helperText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#FFE1E1',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  matchesList: {
    paddingBottom: 16,
    gap: 12,
  },
  emptyText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.95,
    marginTop: 30,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  matchTitle: {
    color: '#171717',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  matchInfo: {
    color: '#2D2D2D',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  matchStatus: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#7E1F26',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: {
    color: '#151515',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalText: {
    color: '#2F2F2F',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalButton: {
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalCancel: {
    backgroundColor: '#8A8A8A',
  },
  modalConfirm: {
    backgroundColor: '#1D8D4A',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
