import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './Screens/login';
import RegistroUsuarioScreen from './Screens/RegistroUsuario';

export default function App() {
  const [screen, setScreen] = useState('login');

  return (
    <>
      <StatusBar style="light" />
      {screen === 'login' ? (
        <LoginScreen onGoRegister={() => setScreen('registro')} />
      ) : (
        <RegistroUsuarioScreen onGoLogin={() => setScreen('login')} />
      )}
    </>
  );
}
