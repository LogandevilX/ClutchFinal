import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import InicioScreen from './Screens/Inicio';
import LoginScreen from './Screens/login';
import RegistroUsuarioScreen from './Screens/RegistroUsuario';
import HomeScreen from './Screens/Home';
import PerfilScreen from './Screens/Perfil';
import DetalleEquipoScreen from './Screens/DetalleEquipo';

export default function App() {
  const [screen, setScreen] = useState('inicio');
  const [loggedUser, setLoggedUser] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

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
          onLoginSuccess={(user) => {
            setLoggedUser(user);
            setScreen('home');
          }}
        />
      ) : null}

      {screen === 'registro' ? (
        <RegistroUsuarioScreen
          onGoLogin={() => setScreen('login')}
          onGoBackHome={() => setScreen('inicio')}
        />
      ) : null}
      {screen === 'home' ? (
        <HomeScreen
          user={loggedUser}
          onGoProfile={() => setScreen('perfil')}
          onGoTeamDetail={(teamId) => {
            setSelectedTeamId(teamId);
            setScreen('detalleEquipo');
          }}
        />
      ) : null}

      {screen === 'perfil' ? (
        <PerfilScreen
          user={loggedUser}
          onUserUpdate={(updatedUser) => setLoggedUser(updatedUser)}
          onGoHome={() => setScreen('home')}
        />
      ) : null}

      {screen === 'detalleEquipo' ? (
        <DetalleEquipoScreen
          teamId={selectedTeamId}
          user={loggedUser}
          onGoBack={() => setScreen('home')}
        />
      ) : null}

    </>
  );
}
