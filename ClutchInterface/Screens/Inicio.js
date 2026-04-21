import { Image, ImageBackground, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const backgroundImage = require('../assets/Fondo_Inicio.png');

export default function InicioScreen({ onGoLogin, onGoRegister }) {
  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlayCard}>
          <View style={styles.logoCircle}>
            <Image source={require('../assets/LogoClutch.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <Pressable style={[styles.button, styles.loginButton]} onPress={onGoLogin}>
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.registerButton]} onPress={onGoRegister}>
            <Text style={styles.buttonText}>Registrarte</Text>
          </Pressable>
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
    backgroundColor: 'rgba(7, 18, 35, 0.58)',
    borderRadius: 36,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
    overflow: 'hidden',
  },
  logo: {
    width: 170,
    height: 170,
  },
  button: {
    width: '100%',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
  },
  loginButton: {
    backgroundColor: 'rgba(93, 244, 255, 0.22)',
    borderColor: '#64F2FF',
  },
  registerButton: {
    backgroundColor: 'rgba(138, 93, 255, 0.26)',
    borderColor: '#9F7CFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
});
