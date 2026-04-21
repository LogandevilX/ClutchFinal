import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import InicioScreen from './Screens/Inicio';
import LoginScreen from './Screens/login';
import RegistroUsuarioScreen from './Screens/RegistroUsuario';

export default function App() {
  const [screen, setScreen] = useState('inicio');

  return (
    <>
      <StatusBar style="light" />
      {screen === 'inicio' ? (
        <InicioScreen
          onGoLogin={() => setScreen('login')}
          onGoRegister={() => setScreen('registro')}
        />
      ) : null}

      {screen === 'login' ? (
        <LoginScreen
          onGoRegister={() => setScreen('registro')}
          onGoBackHome={() => setScreen('inicio')}
        />
      ) : null}

      {screen === 'registro' ? (
        <RegistroUsuarioScreen
          onGoLogin={() => setScreen('login')}
          onGoBackHome={() => setScreen('inicio')}
        />
      )}
    </>
  );
}
