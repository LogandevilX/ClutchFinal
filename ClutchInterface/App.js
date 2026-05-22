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
import PartidoEspectadoScreen from './Screens/PartidoEspectado';
import { logoutUsuario } from './services/authService';

export default function App() {
  const [screen, setScreen] = useState('inicio');
  const [loggedUser, setLoggedUser] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [playerDetailBackScreen, setPlayerDetailBackScreen] = useState('home');
  const [selectedMesaMatch, setSelectedMesaMatch] = useState(null);
  const [liveMatchPayload, setLiveMatchPayload] = useState(null);
  const [selectedLiveMatch, setSelectedLiveMatch] = useState(null);

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
          onGoLiveMatch={(match) => {
            setSelectedLiveMatch(match);
            setScreen('partidoEspectado');
          }}
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

      {screen === 'partidoEspectado' ? (
        <PartidoEspectadoScreen
          user={loggedUser}
          partido={selectedLiveMatch}
          onGoProfile={() => setScreen('perfil')}
          onGoBack={() => {
            setSelectedLiveMatch(null);
            setScreen('home');
          }}
        />
      ) : null}

      {screen === 'perfil' ? (
        <PerfilScreen
          user={loggedUser}
          onUserUpdate={(updatedUser) => setLoggedUser(updatedUser)}
          onGoHome={() => setScreen(loggedUser?.rol === 'ANOTADOR' ? 'inicioMesa' : 'home')}
          onLogout={() => {
            logoutUsuario();
            setLoggedUser(null);
            setSelectedTeamId(null);
            setSelectedPlayerId(null);
            setPlayerDetailBackScreen('home');
            setSelectedMesaMatch(null);
            setLiveMatchPayload(null);
            setSelectedLiveMatch(null);
            setScreen('inicio');
          }}
        />
      ) : null}

      {screen === 'inicioMesa' ? (
        <InicioMesaScreen
          user={loggedUser}
          onGoProfile={() => setScreen('perfil')}
          onGoStartMatch={(match) => {
            setSelectedMesaMatch(match);
            setScreen('iniciarPartido');
          }}
          onGoCurrentMatch={(match) => {
            setLiveMatchPayload({
              partido: match,
              setupData: null,
            });
            setScreen('partido');
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
          onMatchStarted={(payload) => {
            setLiveMatchPayload(payload);
            setSelectedMesaMatch(null);
            setScreen('partido');
          }}
        />
      ) : null}

      {screen === 'partido' ? (
        <PartidoScreen
          partido={liveMatchPayload?.partido}
          setupData={liveMatchPayload?.setupData}
          initialState={liveMatchPayload?.state}
          onExit={() => {
            setLiveMatchPayload(null);
            setScreen('inicioMesa');
          }}
        />
      ) : null}

      {screen === 'detalleEquipo' ? (
        <DetalleEquipoScreen
          teamId={selectedTeamId}
          user={loggedUser}
          onGoBack={() => setScreen('home')}
          onGoMatchDetail={(match) => {
            setSelectedLiveMatch(match);
            setScreen('partidoEspectado');
          }}
          onGoPlayerDetail={(playerId) => {
            setSelectedPlayerId(playerId);
            setPlayerDetailBackScreen('detalleEquipo');
            setScreen('detalleJugador');
          }}
          onGoTeamDetail={(nextTeamId) => {
            setSelectedTeamId(nextTeamId);
            setScreen('detalleEquipo');
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
