import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { registrarEspectador } from '../services/authService';

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

    try {
      const response = await registrarEspectador({
        apodo: apodo.trim(),
        email: email.trim(),
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
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Pressable onPress={onGoLogin}>
            <Text style={styles.backText}>← Volver a Login</Text>
          </Pressable>

          <Text style={styles.title}>Registro de Usuario</Text>
          <Text style={styles.subtitle}>
            Todos los usuarios creados desde esta pantalla tendrán rol{' '}
            <Text style={styles.highlight}>ESPECTADOR</Text>.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Apodo"
            placeholderTextColor="#7A7A7A"
            value={apodo}
            onChangeText={setApodo}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#7A7A7A"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#7A7A7A"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            placeholderTextColor="#7A7A7A"
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
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  backText: {
    color: '#1B263B',
    fontSize: 15,
    marginBottom: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D1B2A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#3D4A5A',
    marginBottom: 20,
    lineHeight: 20,
  },
  highlight: {
    color: '#E85D04',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D6D6D6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#0D1B2A',
    backgroundColor: '#FAFAFA',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#1B263B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
