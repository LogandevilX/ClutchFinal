import { API_ASSETS_BASE_URL, API_BASE_URL, parseResponse } from './apiConfig';

const FAVORITOS_URL = `${API_BASE_URL}/favoritos`;
const EQUIPOS_URL = `${API_BASE_URL}/equipos`;
const JUGADORES_URL = `${API_BASE_URL}/jugadores`;
const PARTIDOS_URL = `${API_BASE_URL}/partidos`;
const INSCRIPCIONES_URL = `${API_BASE_URL}/inscripciones`;
const SEARCH_STATIC_TTL_MS = 5 * 60 * 1000;

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
const getDateValue = (value) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getPlayerFullName = (player) =>
  [player?.nombre, player?.primerApellido, player?.segundoApellido].filter(Boolean).join(' ').trim();

let searchStaticCache = {
  expiresAt: 0,
  teamResults: [],
  playerResults: [],
};

async function getSearchStaticDataset() {
  const now = Date.now();

  if (searchStaticCache.expiresAt > now) {
    return searchStaticCache;
  }

  const [equiposResponse, inscripcionesResponse] = await Promise.all([
    fetchJson(EQUIPOS_URL),
    fetchJson(INSCRIPCIONES_URL),
  ]);

  if (!equiposResponse.ok || !inscripcionesResponse.ok) {
    throw new Error('No se pudieron cargar los datos base de búsqueda.');
  }

  const allTeams = safeArray(equiposResponse.data);
  const allInscripciones = safeArray(inscripcionesResponse.data);
  const divisionByTeamId = new Map(
    allInscripciones
      .filter((inscripcion) => typeof inscripcion?.equipoId === 'number')
      .map((inscripcion) => [inscripcion.equipoId, inscripcion?.nombreDivision || ''])
  );

  const teamResults = allTeams.map((team) => ({
    type: 'team',
    key: `team-${team.id}`,
    id: team.id,
    nombreEquipo: team.nombreEquipo,
    division: divisionByTeamId.get(team.id) || '',
    logoUrl: buildAbsoluteAssetUrl(team.urlEscudo),
  }));

  const teamDetailResponses = await Promise.all(
    allTeams
      .filter((team) => typeof team?.id === 'number')
      .map((team) => fetchJson(`${EQUIPOS_URL}/${team.id}`))
  );

  teamDetailResponses.forEach((response) => {
    if (!response.ok) {
      throw new Error('No se pudieron cargar los detalles de equipos para la búsqueda.');
    }
  });

  const seenRows = new Set();
  const playerResults = [];

  teamDetailResponses.forEach((response) => {
    const team = response.data;

    safeArray(team?.jugadores).forEach((player) => {
      const dedupeKey = `${player?.id}-${team?.id}`;

      if (!player?.id || seenRows.has(dedupeKey)) {
        return;
      }

      seenRows.add(dedupeKey);
      playerResults.push({
        type: 'player',
        key: `player-${player.id}-team-${team.id}`,
        id: player.id,
        nombreCompleto: getPlayerFullName(player),
        equipoId: team.id,
        equipoNombre: team.nombreEquipo,
      });
    });
  });

  searchStaticCache = {
    expiresAt: now + SEARCH_STATIC_TTL_MS,
    teamResults,
    playerResults,
  };

  return searchStaticCache;
}

export async function addFavorite({ usuarioId, equipoId = null, jugadorId = null }) {
  const response = await fetch(FAVORITOS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuarioId, equipoId, jugadorId }),
  });

  return parseResponse(response);
}

export async function toggleFavoriteTeam({ usuarioId, equipoId }) {
  const favoritosResponse = await fetchJson(`${FAVORITOS_URL}/usuario/${usuarioId}`);

  if (!favoritosResponse.ok) {
    throw new Error('No se pudieron cargar los favoritos para actualizar el equipo.');
  }

  const teamFavorite = safeArray(favoritosResponse.data).find(
    (favorito) => favorito?.equipoId === equipoId && !favorito?.jugadorId
  );

  if (teamFavorite?.id) {
    const deleteResponse = await fetch(`${FAVORITOS_URL}/${teamFavorite.id}`, {
      method: 'DELETE',
    });
    return parseResponse(deleteResponse);
  }

  return addFavorite({ usuarioId, equipoId, jugadorId: null });
}

export async function fetchSearchData(usuarioId, searchText) {
  const query = String(searchText || '').trim().toLowerCase();

  const [favoritosResponse, staticDataset] = await Promise.all([
    fetchJson(`${FAVORITOS_URL}/usuario/${usuarioId}`),
    getSearchStaticDataset(),
  ]);

  if (!favoritosResponse.ok) {
    throw new Error('No se pudieron cargar los favoritos para la búsqueda.');
  }

  const favoritos = safeArray(favoritosResponse.data);

  const favoriteTeamIds = new Set(
    favoritos.map((favorito) => favorito?.equipoId).filter((id) => typeof id === 'number')
  );

  const favoritePlayerIds = new Set(
    favoritos.map((favorito) => favorito?.jugadorId).filter((id) => typeof id === 'number')
  );

  const teamResults = staticDataset.teamResults
    .map((team) => ({
      ...team,
      isFavorite: favoriteTeamIds.has(team.id),
    }))
    .filter((team) => (query ? String(team.nombreEquipo || '').toLowerCase().includes(query) : true));

  const playerResults = staticDataset.playerResults
    .map((player) => ({
      ...player,
      isFavorite: favoritePlayerIds.has(player.id),
    }))
    .filter((player) => (query ? String(player.nombreCompleto || '').toLowerCase().includes(query) : true));

  return {
    teamResults,
    playerResults,
  };
}

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

export async function fetchTeamDetailData({ usuarioId, equipoId }) {
  const [teamResponse, partidosResponse, inscripcionesResponse, equiposResponse, favoritosResponse] = await Promise.all([
    fetchJson(`${EQUIPOS_URL}/${equipoId}`),
    fetchJson(PARTIDOS_URL),
    fetchJson(INSCRIPCIONES_URL),
    fetchJson(EQUIPOS_URL),
    fetchJson(`${FAVORITOS_URL}/usuario/${usuarioId}`),
  ]);

  if (!teamResponse.ok || !partidosResponse.ok || !inscripcionesResponse.ok || !equiposResponse.ok || !favoritosResponse.ok) {
    throw new Error('No se pudo cargar el detalle del equipo.');
  }

  const team = teamResponse.data;
  const inscripciones = safeArray(inscripcionesResponse.data);
  const allMatches = safeArray(partidosResponse.data);
  const allTeams = safeArray(equiposResponse.data);
  const favoritos = safeArray(favoritosResponse.data);

  const currentInscripcion = inscripciones.find((entry) => entry?.equipoId === equipoId) || null;
  const selectedFaseId = currentInscripcion?.faseId || null;
  const selectedGrupoId = currentInscripcion?.grupoId || null;

  const sameDivisionEntries = inscripciones.filter(
    (entry) => entry?.nombreDivision && entry.nombreDivision === currentInscripcion?.nombreDivision
  );

  const classificationTeamIds = new Set(
    (selectedGrupoId
      ? sameDivisionEntries.filter((entry) => entry?.grupoId === selectedGrupoId)
      : sameDivisionEntries
    ).map((entry) => entry?.equipoId)
  );

  const classification = allTeams
    .filter((entry) => classificationTeamIds.has(entry?.id))
    .map((entry) => {
      const inscripcionEquipo = sameDivisionEntries.find((inscripcion) => inscripcion?.equipoId === entry?.id);

      return {
        ...entry,
        faseId: inscripcionEquipo?.faseId || null,
        grupoId: inscripcionEquipo?.grupoId || null,
      };
    })
    .sort((a, b) => {
      const positionDiff = toSafeNumber(a?.posicion) - toSafeNumber(b?.posicion);

      if (positionDiff !== 0) {
        return positionDiff;
      }

      return toSafeNumber(b?.puntos) - toSafeNumber(a?.puntos);
    });

  const phases = Array.from(
    new Map(
      inscripciones
        .filter((entry) => entry?.equipoId === equipoId)
        .map((entry) => [entry.faseId, { faseId: entry.faseId, nombreFase: entry.faseActual || `Fase ${entry.faseId}` }])
    ).values()
  );
  const groupsByPhase = {};

  phases.forEach((phase) => {
    groupsByPhase[phase.faseId] = Array.from(
      new Map(
        inscripciones
          .filter((entry) => entry?.faseId === phase.faseId)
          .map((entry) => [entry.grupoId, { grupoId: entry.grupoId, nombreGrupo: entry.nombreGrupo || `Grupo ${entry.grupoId}` }])
      ).values()
    );
  });

  const teamMatches = allMatches
    .filter((match) => {
      const localId = match?.equipoLocal?.id;
      const awayId = match?.equipoVisitante?.id;
      return localId === equipoId || awayId === equipoId;
    })
    .map((match) => ({
      ...match,
      equipoLocal: {
        ...match?.equipoLocal,
        urlEscudo: buildAbsoluteAssetUrl(match?.equipoLocal?.urlEscudo),
      },
      equipoVisitante: {
        ...match?.equipoVisitante,
        urlEscudo: buildAbsoluteAssetUrl(match?.equipoVisitante?.urlEscudo),
      },
    }))
    .sort((a, b) => getDateValue(a?.fechaHoraInicio) - getDateValue(b?.fechaHoraInicio));

  return {
    team: {
      ...team,
      urlEscudo: buildAbsoluteAssetUrl(team?.urlEscudo),
      inscripcion: currentInscripcion,
    },
    players: safeArray(team?.jugadores).map((player) => ({
      ...player,
      pathFoto: buildAbsoluteAssetUrl(player?.pathFoto),
    })),
    classification,
    phases,
    groupsByPhase,
    matches: teamMatches,
    isFavorite: favoritos.some((favorito) => favorito?.equipoId === equipoId && !favorito?.jugadorId),
  };
}
