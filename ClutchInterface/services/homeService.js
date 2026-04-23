import { API_ASSETS_BASE_URL, API_BASE_URL, parseResponse } from './apiConfig';

const FAVORITOS_URL = `${API_BASE_URL}/favoritos`;
const EQUIPOS_URL = `${API_BASE_URL}/equipos`;
const JUGADORES_URL = `${API_BASE_URL}/jugadores`;
const PARTIDOS_URL = `${API_BASE_URL}/partidos`;
const INSCRIPCIONES_URL = `${API_BASE_URL}/inscripciones`;

const safeArray = (value) => (Array.isArray(value) ? value : []);

const buildAbsoluteAssetUrl = (path) => {
  if (!path || typeof path !== 'string') {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ASSETS_BASE_URL}${normalizedPath}`;
};

async function fetchJson(url) {
  const response = await fetch(url);
  return parseResponse(response);
}

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToOneDecimal = (value) => Math.round(value * 10) / 10;

export async function fetchHomeData(usuarioId) {
  const [favoritosResponse, partidosResponse, equiposResponse, inscripcionesResponse] = await Promise.all([
    fetchJson(`${FAVORITOS_URL}/usuario/${usuarioId}`),
    fetchJson(PARTIDOS_URL),
    fetchJson(EQUIPOS_URL),
    fetchJson(INSCRIPCIONES_URL),
  ]);

  if (!favoritosResponse.ok) {
    throw new Error('No se pudieron cargar los favoritos del usuario.');
  }

  if (!partidosResponse.ok) {
    throw new Error('No se pudieron cargar los partidos.');
  }

  if (!equiposResponse.ok) {
    throw new Error('No se pudieron cargar los equipos.');
  }

  if (!inscripcionesResponse.ok) {
    throw new Error('No se pudieron cargar las inscripciones.');
  }

  const favoritos = safeArray(favoritosResponse.data);
  const allMatches = safeArray(partidosResponse.data);
  const allTeams = safeArray(equiposResponse.data);
  const allInscripciones = safeArray(inscripcionesResponse.data);

  const followedTeamIds = new Set(
    favoritos.map((favorito) => favorito?.equipoId).filter((id) => typeof id === 'number')
  );

  const followedPlayerIds = favoritos
    .map((favorito) => favorito?.jugadorId)
    .filter((id) => typeof id === 'number');

  const teamsById = new Map(allTeams.map((team) => [team.id, team]));

  const playerResponses = await Promise.all(
    followedPlayerIds.map((id) => fetchJson(`${JUGADORES_URL}/${id}`))
  );

  playerResponses.forEach((response) => {
    if (!response.ok) {
      throw new Error('No se pudieron cargar todos los jugadores favoritos.');
    }
  });

  const followedPlayers = playerResponses.map((response) => response.data);
  const matchesById = new Map(
    allMatches
      .filter((match) => typeof match?.id === 'number')
      .map((match) => [match.id, match])
  );

  const teamDetailResponses = await Promise.all(
    [...followedTeamIds].map((teamId) => fetchJson(`${EQUIPOS_URL}/${teamId}`))
  );

  teamDetailResponses.forEach((response) => {
    if (!response.ok) {
      throw new Error('No se pudieron cargar los detalles de todos los equipos favoritos.');
    }
  });

  const teamDetails = teamDetailResponses.map((response) => response.data);
  const playerTeamMap = new Map();

  teamDetails.forEach((team) => {
    safeArray(team?.jugadores).forEach((player) => {
      if (typeof player?.id === 'number') {
        playerTeamMap.set(player.id, team.id);
      }
    });
  });

  const followedTeams = [...followedTeamIds]
    .map((teamId) => teamsById.get(teamId))
    .filter(Boolean)
    .map((team) => {
      const teamInscripcion = allInscripciones.find((inscripcion) => inscripcion?.equipoId === team.id);
      const nombreDivision = teamInscripcion?.nombreDivision || team?.division || '';
      const nombreGrupo = teamInscripcion?.nombreGrupo || team?.grupo || '';

      return {
        ...team,
        division: nombreDivision,
        grupo: nombreGrupo,
        inscripcionEquipo:
          nombreDivision || nombreGrupo ? `${nombreDivision || '-'} · ${nombreGrupo || '-'}` : '',
        shieldUrl: buildAbsoluteAssetUrl(team.urlEscudo),
      };
    });

  const liveMatches = allMatches
    .filter((match) => {
      const localId = match?.equipoLocal?.id;
      const awayId = match?.equipoVisitante?.id;

      const followsTeam = followedTeamIds.has(localId) || followedTeamIds.has(awayId);
      const started = Boolean(match?.fechaHoraInicio);
      const finished = Boolean(match?.fechaHoraFin);

      return followsTeam && started && !finished;
    })
    .map((match) => ({
      ...match,
      equipoLocal: {
        ...match.equipoLocal,
        urlEscudo: buildAbsoluteAssetUrl(match?.equipoLocal?.urlEscudo),
      },
      equipoVisitante: {
        ...match.equipoVisitante,
        urlEscudo: buildAbsoluteAssetUrl(match?.equipoVisitante?.urlEscudo),
      },
    }));

  const players = followedPlayers.map((player) => ({
    ...player,
    teamId: playerTeamMap.get(player.id) ?? null,
    photoUrl: buildAbsoluteAssetUrl(player.pathFoto),
  }));

  const playerActaResponses = await Promise.all(
    players.map((player) => fetchJson(`${JUGADORES_URL}/${player.id}/actas`))
  );

  playerActaResponses.forEach((response) => {
    if (!response.ok) {
      throw new Error('No se pudieron cargar las actas de todos los jugadores favoritos.');
    }
  });

  const playersWithStats = players.map((player, playerIndex) => {
    const actas = safeArray(playerActaResponses[playerIndex]?.data);
    const partidosJugados = actas.length;
    const minutosTotales = actas.reduce((sum, acta) => sum + toSafeNumber(acta?.minutosJugados), 0);
    const puntosTotales = actas.reduce((sum, acta) => sum + toSafeNumber(acta?.puntos), 0);
    const minutosPorPartido = partidosJugados ? roundToOneDecimal(minutosTotales / partidosJugados) : 0;
    const puntosPorPartido = partidosJugados ? roundToOneDecimal(puntosTotales / partidosJugados) : 0;

    const ultimaActa = [...actas].sort((a, b) => {
      const partidoA = matchesById.get(a?.partidoId);
      const partidoB = matchesById.get(b?.partidoId);
      const timeA = partidoA?.fechaHoraInicio ? new Date(partidoA.fechaHoraInicio).getTime() : 0;
      const timeB = partidoB?.fechaHoraInicio ? new Date(partidoB.fechaHoraInicio).getTime() : 0;

      if (timeA !== timeB) {
        return timeB - timeA;
      }

      return toSafeNumber(b?.partidoId) - toSafeNumber(a?.partidoId);
    })[0];

    return {
      ...player,
      partidosJugados,
      minutosPorPartido,
      puntosPorPartido,
      ultimoPartidoMinutos: roundToOneDecimal(toSafeNumber(ultimaActa?.minutosJugados)),
      ultimoPartidoPuntos: toSafeNumber(ultimaActa?.puntos),
    };
  });

  return {
    liveMatches,
    followedTeams,
    followedPlayers: playersWithStats,
  };
}
