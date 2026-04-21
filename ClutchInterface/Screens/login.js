import { useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const backgroundImage = {
  uri: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1400&q=80',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlayCard}>
          <Pressable style={styles.registerLink}>
            <Text style={styles.registerText}>Registrarse</Text>
          </Pressable>

          <View style={styles.logoCircle}>
            <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
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

            <Pressable style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Entrar</Text>
            </Pressable>

            <Pressable>
              <Text style={styles.adminText}>Entrar como Administrador</Text>
            </Pressable>
          </View>
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
  overlayCard: {
    flex: 1,
    backgroundColor: 'rgba(7, 18, 35, 0.65)',
    borderRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  registerLink: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  registerText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '300',
  },
  logoCircle: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  logo: {
    width: 116,
    height: 116,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 70,
  },
  formBlock: {
    marginTop: 10,
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
    fontSize: 40,
    fontWeight: '700',
  },
  adminText: {
    color: '#FFFFFF',
    marginTop: 18,
    textDecorationLine: 'underline',
    fontSize: 24,
    fontWeight: '400',
  },
});
