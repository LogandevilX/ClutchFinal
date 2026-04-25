import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import InicioScreen from './Screens/Inicio';
import LoginScreen from './Screens/login';
import RegistroUsuarioScreen from './Screens/RegistroUsuario';
import HomeScreen from './Screens/Home';
import PerfilScreen from './Screens/Perfil';
import DetalleEquipoScreen from './Screens/DetalleEquipo';
import DetalleJugadorScreen from './Screens/DetalleJugador';
import InicioMesaScreen from './Screens/InicioMesa';
import IniciarPartidoScreen from './Screens/IniciarPartido';
import PartidoScreen from './Screens/Partido';

export default function App() {
  const [screen, setScreen] = useState('inicio');
  const [loggedUser, setLoggedUser] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerDetailBackScreen, setPlayerDetailBackScreen] = useState('home');
  const [selectedMesaMatch, setSelectedMesaMatch] = useState(null);
  const [activeMesaMatch, setActiveMesaMatch] = useState(null);

  const goToInitialLoggedScreen = (user) => {
    if (user?.rol === 'ANOTADOR') {
      setScreen('inicioMesa');
      return;
    }

    setScreen('home');
  };

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
            goToInitialLoggedScreen(user);
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
          onGoPlayerDetail={(playerId) => {
            setSelectedPlayerId(playerId);
            setPlayerDetailBackScreen('home');
            setScreen('detalleJugador');
          }}
        />
      ) : null}

      {screen === 'perfil' ? (
        <PerfilScreen
          user={loggedUser}
          onUserUpdate={(updatedUser) => setLoggedUser(updatedUser)}
          onGoHome={() => setScreen(loggedUser?.rol === 'ANOTADOR' ? 'inicioMesa' : 'home')}
          onLogout={() => {
            setLoggedUser(null);
            setSelectedTeamId(null);
            setSelectedPlayerId(null);
            setPlayerDetailBackScreen('home');
            setSelectedMesaMatch(null);
            setActiveMesaMatch(null);
            setScreen('inicio');
          }}
        />
      ) : null}

      {screen === 'inicioMesa' ? (
        <InicioMesaScreen
          user={loggedUser}
          onGoProfile={() => setScreen('perfil')}
          activeMatch={activeMesaMatch}
          onResumeMatch={(match) => {
            setSelectedMesaMatch(match);
            setScreen('partido');
          }}
          onGoStartMatch={(match) => {
            setSelectedMesaMatch(match);
            setActiveMesaMatch(match);
            setScreen('partido');
          }}
        />
      ) : null}


      {screen === 'partido' ? (
        <PartidoScreen
          match={selectedMesaMatch}
          onSetActiveMatch={setActiveMesaMatch}
          onGoBack={() => {
            setScreen('inicioMesa');
          }}
        />
      ) : null}

      {screen === 'iniciarPartido' ? (
        <IniciarPartidoScreen
          partido={selectedMesaMatch}
          onGoBack={() => {
            setSelectedMesaMatch(null);
            setScreen('inicioMesa');
          }}
        />
      ) : null}

      {screen === 'detalleEquipo' ? (
        <DetalleEquipoScreen
          teamId={selectedTeamId}
          user={loggedUser}
          onGoBack={() => setScreen('home')}
          onGoPlayerDetail={(playerId) => {
            setSelectedPlayerId(playerId);
            setPlayerDetailBackScreen('detalleEquipo');
            setScreen('detalleJugador');
          }}
        />
      ) : null}

      {screen === 'detalleJugador' ? (
        <DetalleJugadorScreen
          playerId={selectedPlayerId}
          user={loggedUser}
          onGoBack={() => setScreen(playerDetailBackScreen)}
        />
      ) : null}

    </>
  );
}
