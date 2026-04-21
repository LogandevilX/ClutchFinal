import { useState } from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registrarEspectador } from '../services/authService';

const backgroundImage = require('../assets/Fondo_Inicio.png');

export default function RegistroUsuarioScreen({ onGoLogin }) {
  const [apodo, setApodo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const onRegistro = async () => {
    if (!apodo || !email || !password || !confirmacion) {
      Alert.alert('Campos incompletos', 'Completa todos los campos para continuar.');
      return;
    }

    if (password !== confirmacion) {
      Alert.alert('Contraseñas no coinciden', 'Revisa la confirmación de contraseña.');
      return;
    }

    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado.includes('@') || !emailNormalizado.includes('.com')) {
      Alert.alert('Correo inválido', 'El correo debe incluir "@" y un dominio como ".com".');
      return;
    }

    try {
      const response = await registrarEspectador({
        apodo: apodo.trim(),
        email: emailNormalizado,
        password,
      });

      if (!response.ok) {
        Alert.alert('Registro fallido', 'No se pudo crear el usuario. Revisa los datos.');
        return;
      }

      Alert.alert('Registro completado', 'Usuario creado con rol ESPECTADOR.', [
        {
          text: 'Ir a login',
          onPress: onGoLogin,
        },
      ]);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con la API de ClutchFinal.');
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.card}>

                {/* Convertido a TouchableOpacity con forma de píldora */}
                <TouchableOpacity
                  onPress={onGoLogin}
                  style={styles.backButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                  <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Registro de Usuario</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Apodo"
                  placeholderTextColor="#666"
                  value={apodo}
                  onChangeText={setApodo}
                  autoCapitalize="words"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#666"
                  value={confirmacion}
                  onChangeText={setConfirmacion}
                  secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={onRegistro}>
                  <Text style={styles.buttonText}>Crear cuenta</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
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
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  keyboardContainer: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(7, 18, 35, 0.65)',
    borderRadius: 36,
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 26,
    // Nuevos estilos para hacer que parezca un botón real
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Fondo semitransparente
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20, // Forma de píldora
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Borde sutil
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700', // Un poco más grueso para que destaque
    marginLeft: 8, // Separación ajustada entre el icono y el texto
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    paddingHorizontal: 22,
    fontSize: 20,
    color: '#1A1A1A',
    fontWeight: '700',
  },
  button: {
    marginTop: 14,
    backgroundColor: '#7E1F26',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
});