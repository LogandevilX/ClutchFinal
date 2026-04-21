import { Image, ImageBackground, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const backgroundImage = require('../assets/Fondo_HomePage.png');

export default function InicioScreen({ onGoLogin, onGoRegister }) {
  // Estos valores se ajustan con los controles interactivos de abajo
  const logoCircleSize = 140;
  const logoSize = 120;
  const buttonFontSize = 24;

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <View style={[styles.logoCircle, { width: logoCircleSize, height: logoCircleSize, borderRadius: logoCircleSize / 2 }]}>
            <Image source={require('../assets/LogoClutch.png')} style={[styles.logo, { width: logoSize, height: logoSize }]} resizeMode="contain" />
          </View>

          <Pressable style={[styles.button, styles.electricBlackButton]} onPress={onGoLogin}>
            <Text style={[styles.buttonText, { fontSize: buttonFontSize }]}>Iniciar sesión</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.electricBlackButton]} onPress={onGoRegister}>
            <Text style={[styles.buttonText, { fontSize: buttonFontSize }]}>Registrarte</Text>
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
  mainContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  logoCircle: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
    overflow: 'hidden',
  },
  logo: {
    // El tamaño se controla mediante props en el componente
  },
  button: {
    width: '100%',
    borderRadius: 30,
    paddingVertical: 16, // Aumentado el padding vertical
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
  },
  // --- Modificación: Botones Negro Eléctrico ---
  electricBlackButton: {
    // Un negro muy oscuro como base
    backgroundColor: '#050505',
    // Un borde muy sutil y oscuro para definición
    borderColor: '#111111',
    // Podrías añadir sombreado sutil para el efecto eléctrico si usas librerías externas
  },
  buttonText: {
    color: '#FFFFFF',
    // El tamaño se controla mediante props en el componente
    fontWeight: '700',
  },
});
