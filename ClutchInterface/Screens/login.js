import { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { loginUsuario } from '../services/authService';

const backgroundImage = require('../assets/Fondo_Inicio.png');

export default function LoginScreen({ onGoRegister, onGoBackHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos incompletos', 'Introduce email y contraseña.');
      return;
    }

    try {
      const response = await loginUsuario(email.trim(), password);

      if (!response.ok) {
        Alert.alert('Error de acceso');
        return;
      }

      const usuario = response.data;
      Alert.alert('Login correcto', `Bienvenido ${usuario.apodo || usuario.email}`);
    } catch (error) {
      Alert.alert('Error de conexión', 'No se pudo conectar con la API');
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 10}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.overlayCard}>
              <Pressable style={styles.backButton} onPress={onGoBackHome}>
                <Text style={styles.backText}>← Volver al inicio</Text>
              </Pressable>

              <View style={styles.logoCircle}>
                <Image source={require('../assets/LogoClutch.png')} style={styles.logo} resizeMode="contain" />
              </View>

              <Text style={styles.title}>¡Bienvenido!</Text>

              <View style={styles.formBlock}>
                <TextInput
                  style={styles.input}
                  placeholder="E-Mail"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#666"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <Pressable style={styles.loginButton} onPress={onLogin}>
                  <Text style={styles.loginButtonText}>Entrar</Text>
                </Pressable>

                <Pressable onPress={onGoRegister}>
                  <Text style={styles.bottomRegisterText}>Registrarse</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: 'rgba(7, 18, 35, 0.65)',
    borderRadius: 36,
    paddingHorizontal: 24,
    justifyContent: 'center', // <-- Alineación vertical centrada añadida
    // Se han eliminado paddingTop y paddingBottom para que el centro sea exacto
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#7E1F26',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15, // Se ha eliminado el marginTop para equilibrar visualmente con el título
    overflow: 'hidden',
  },
  logo: {
    width: 170,
    height: 170,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 25,
  },
  formBlock: {
    width: '100%', // <-- Añadido para garantizar que los inputs ocupen todo el ancho disponible
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 18,
    paddingHorizontal: 22,
    fontSize: 24,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#7E1F26',
    borderRadius: 30,
    width: 230,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  bottomRegisterText: {
    color: '#FFFFFF',
    marginTop: 18,
    textDecorationLine: 'underline',
    fontSize: 24,
    fontWeight: '400',
  },
});
