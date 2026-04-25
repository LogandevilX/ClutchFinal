import { API_ASSETS_BASE_URL, API_BASE_URL, parseResponse } from './apiConfig';

const FAVORITOS_URL = `${API_BASE_URL}/favoritos`;
const JUGADORES_URL = `${API_BASE_URL}/jugadores`;
const PARTIDOS_URL = `${API_BASE_URL}/partidos`;
const EQUIPOS_URL = `${API_BASE_URL}/equipos`;
const INSCRIPCIONES_URL = `${API_BASE_URL}/inscripciones`;

const safeArray = (value) => (Array.isArray(value) ? value : []);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(toNumber(value) * factor) / factor;
};

const percent = (made, attempted) => {
  const attempts = toNumber(attempted);
  if (!attempts) {
    return 0;
  }

  return round((toNumber(made) / attempts) * 100, 1);
};

const avg = (sum, games) => {
  const totalGames = toNumber(games);
  if (!totalGames) {
    return 0;
  }

  return round(toNumber(sum) / totalGames, 1);
};

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

const getPlayerFullName = (player) =>
  [player?.nombre, player?.primerApellido, player?.segundoApellido].filter(Boolean).join(' ').trim();

const getDateValue = (value) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const getTeamIdsByDivision = (inscripciones, divisionName) =>
  safeArray(inscripciones)
    .map((entry) => ({
      division: entry?.nombreDivision,
      equipoId: toId(entry?.equipoId),
    }))
    .filter((entry) => entry.division === divisionName && entry.equipoId !== null)
    .map((entry) => entry.equipoId);

const aggregateTotals = (actas) =>
  safeArray(actas).reduce(
    (acc, acta) => ({
      games: acc.games + 1,
      minutes: acc.minutes + toNumber(acta?.minutosJugados),
      points: acc.points + toNumber(acta?.puntos),
      value: acc.value + toNumber(acta?.valoracion),
      tlMade: acc.tlMade + toNumber(acta?.tlAnotados),
      tlAttempted: acc.tlAttempted + toNumber(acta?.tlTirados),
      t2Made: acc.t2Made + toNumber(acta?.t2Anotados),
      t2Attempted: acc.t2Attempted + toNumber(acta?.t2Tirados),
      t3Made: acc.t3Made + toNumber(acta?.triplesAnotados),
      t3Attempted: acc.t3Attempted + toNumber(acta?.triplesTirados),
      rebounds: acc.rebounds + toNumber(acta?.rebotes),
      blocks: acc.blocks + toNumber(acta?.tapones),
      steals: acc.steals + toNumber(acta?.robos),
      turnovers: acc.turnovers + toNumber(acta?.perdida),
      fouls: acc.fouls + toNumber(acta?.falta),
      plusMinus: acc.plusMinus + toNumber(acta?.plusMinus),
    }),
    {
      games: 0,
      minutes: 0,
      points: 0,
      value: 0,
      tlMade: 0,
      tlAttempted: 0,
      t2Made: 0,
      t2Attempted: 0,
      t3Made: 0,
      t3Attempted: 0,
      rebounds: 0,
      blocks: 0,
      steals: 0,
      turnovers: 0,
      fouls: 0,
      plusMinus: 0,
    }
  );

const buildSummary = (totals) => ({
  pj: totals.games,
  mpp: avg(totals.minutes, totals.games),
  ppp: avg(totals.points, totals.games),
  vpp: avg(totals.value, totals.games),
});

const metricColorByKey = {
  mpp: '#23c63e',
  ppp: '#ff2e3a',
  tla: '#23c63e',
  tli: '#ff2e3a',
  pctTl: '#ff9a1f',
  t2a: '#2ea7ff',
};

const buildTotalsMetrics = (playerTotals, divisionTotals) => {
  const playerSummary = buildSummary(playerTotals);
  const divisionSummary = buildSummary(divisionTotals);

  return [
    {
      key: 'mpp',
      label: 'Minutos por Partido (MPP)',
      playerValue: playerSummary.mpp,
      divisionValue: divisionSummary.mpp,
    },
    {
      key: 'ppp',
      label: 'Puntos por Partido (PPP)',
      playerValue: playerSummary.ppp,
      divisionValue: divisionSummary.ppp,
    },
    {
      key: 'tla',
      label: 'Tiros Libres Anotados (TLA)',
      playerValue: avg(playerTotals.tlMade, playerTotals.games),
      divisionValue: avg(divisionTotals.tlMade, divisionTotals.games),
    },
    {
      key: 'tli',
      label: 'Tiros Libres Intentados (TLI)',
      playerValue: avg(playerTotals.tlAttempted, playerTotals.games),
      divisionValue: avg(divisionTotals.tlAttempted, divisionTotals.games),
    },
    {
      key: 'pctTl',
      label: 'Porcentaje de Tiro Libre (%TL)',
      playerValue: percent(playerTotals.tlMade, playerTotals.tlAttempted),
      divisionValue: percent(divisionTotals.tlMade, divisionTotals.tlAttempted),
    },
    {
      key: 't2a',
      label: 'Tiros de 2 Anotados (T2A)',
      playerValue: avg(playerTotals.t2Made, playerTotals.games),
      divisionValue: avg(divisionTotals.t2Made, divisionTotals.games),
    },
  ].map((metric) => {
    const maxValue = Math.max(metric.playerValue, metric.divisionValue, 1);

    return {
      ...metric,
      color: metricColorByKey[metric.key] || '#23c63e',
      playerPercent: Math.max(0.08, metric.playerValue / maxValue),
      divisionPercent: Math.max(0.08, metric.divisionValue / maxValue),
    };
  });
};

const buildActaTotals = (totals) => ({
  m: round(totals.minutes),
  pts: totals.points,
  tla: totals.tlMade,
  tli: totals.tlAttempted,
  pctTl: percent(totals.tlMade, totals.tlAttempted),
  t2a: totals.t2Made,
  t2i: totals.t2Attempted,
  pctT2: percent(totals.t2Made, totals.t2Attempted),
  t3a: totals.t3Made,
  t3i: totals.t3Attempted,
  pctT3: percent(totals.t3Made, totals.t3Attempted),
  reb: totals.rebounds,
  tap: totals.blocks,
  rob: totals.steals,
  perd: totals.turnovers,
  falt: totals.fouls,
  val: totals.value,
  pm: totals.plusMinus,
});

const buildActaAverages = (totals) => ({
  m: avg(totals.minutes, totals.games),
  pts: avg(totals.points, totals.games),
  tla: avg(totals.tlMade, totals.games),
  tli: avg(totals.tlAttempted, totals.games),
  pctTl: percent(totals.tlMade, totals.tlAttempted),
  t2a: avg(totals.t2Made, totals.games),
  t2i: avg(totals.t2Attempted, totals.games),
  pctT2: percent(totals.t2Made, totals.t2Attempted),
  t3a: avg(totals.t3Made, totals.games),
  t3i: avg(totals.t3Attempted, totals.games),
  pctT3: percent(totals.t3Made, totals.t3Attempted),
  reb: avg(totals.rebounds, totals.games),
  tap: avg(totals.blocks, totals.games),
  rob: avg(totals.steals, totals.games),
  perd: avg(totals.turnovers, totals.games),
  falt: avg(totals.fouls, totals.games),
  val: avg(totals.value, totals.games),
  pm: avg(totals.plusMinus, totals.games),
});

const toMatchRow = ({ acta, match, selectedTeamId, teamsById }) => {
  const localTeam = match?.equipoLocal;
  const awayTeam = match?.equipoVisitante;
  const rival = toId(localTeam?.id) === selectedTeamId ? awayTeam : localTeam;

  const tlMade = toNumber(acta?.tlAnotados);
  const tlAttempted = toNumber(acta?.tlTirados);
  const t2Made = toNumber(acta?.t2Anotados);
  const t2Attempted = toNumber(acta?.t2Tirados);
  const t3Made = toNumber(acta?.triplesAnotados);
  const t3Attempted = toNumber(acta?.triplesTirados);

  return {
    id: acta?.id,
    rival: rival?.nombreEquipo || teamsById.get(rival?.id)?.nombreEquipo || 'Rival sin identificar',
    values: {
      m: round(acta?.minutosJugados),
      pts: toNumber(acta?.puntos),
      tla: tlMade,
      tli: tlAttempted,
      pctTl: percent(tlMade, tlAttempted),
      t2a: t2Made,
      t2i: t2Attempted,
      pctT2: percent(t2Made, t2Attempted),
      t3a: t3Made,
      t3i: t3Attempted,
      pctT3: percent(t3Made, t3Attempted),
      reb: toNumber(acta?.rebotes),
      tap: toNumber(acta?.tapones),
      rob: toNumber(acta?.robos),
      perd: toNumber(acta?.perdida),
      falt: toNumber(acta?.falta),
      val: toNumber(acta?.valoracion),
      pm: toNumber(acta?.plusMinus),
    },
    sortValue: getDateValue(match?.fechaHoraInicio),
  };
};

export async function toggleFavoritePlayer({ usuarioId, jugadorId }) {
  const favoritosResponse = await fetchJson(`${FAVORITOS_URL}/usuario/${usuarioId}`);

  if (!favoritosResponse.ok) {
    throw new Error('No se pudieron cargar los favoritos para actualizar el jugador.');
  }

  const playerFavorite = safeArray(favoritosResponse.data).find(
    (favorito) => toId(favorito?.jugadorId) === toId(jugadorId) && !favorito?.equipoId
  );

  if (playerFavorite?.id) {
    const deleteResponse = await fetch(`${FAVORITOS_URL}/${playerFavorite.id}`, {
      method: 'DELETE',
    });

    return parseResponse(deleteResponse);
  }

  const createResponse = await fetch(FAVORITOS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuarioId, equipoId: null, jugadorId }),
  });

  return parseResponse(createResponse);
}

export async function fetchPlayerDetailData({ usuarioId, jugadorId }) {
  const [jugadorResponse, actasResponse, partidosResponse, equiposResponse, inscripcionesResponse, favoritosResponse] = await Promise.all([
    fetchJson(`${JUGADORES_URL}/${jugadorId}`),
    fetchJson(`${JUGADORES_URL}/${jugadorId}/actas`),
    fetchJson(PARTIDOS_URL),
    fetchJson(EQUIPOS_URL),
    fetchJson(INSCRIPCIONES_URL),
    fetchJson(`${FAVORITOS_URL}/usuario/${usuarioId}`),
  ]);

  if (!jugadorResponse.ok || !actasResponse.ok || !partidosResponse.ok || !equiposResponse.ok || !inscripcionesResponse.ok || !favoritosResponse.ok) {
    throw new Error('No se pudo cargar el detalle del jugador.');
  }

  const jugador = jugadorResponse.data;
  const playerActas = safeArray(actasResponse.data);
  const allMatches = safeArray(partidosResponse.data);
  const allTeams = safeArray(equiposResponse.data);
  const allInscripciones = safeArray(inscripcionesResponse.data);
  const favoritos = safeArray(favoritosResponse.data);

  const matchesById = new Map(allMatches.map((match) => [match.id, match]));
  const teamsById = new Map(allTeams.map((team) => [team.id, team]));

  const playerTeamIds = Array.from(
    new Set(
      safeArray(jugador?.equipoIds)
        .concat(playerActas.map((acta) => acta?.equipoId))
        .map((id) => toId(id))
        .filter((id) => id !== null)
    )
  );
  const teams = playerTeamIds
    .map((teamId) => teamsById.get(teamId))
    .filter(Boolean)
    .map((team) => ({
      id: team.id,
      nombreEquipo: team.nombreEquipo,
    }));

  const selectedTeamId = toId(teams[0]?.id);

  return {
    player: {
      ...jugador,
      nombreCompleto: getPlayerFullName(jugador),
      pathFoto: buildAbsoluteAssetUrl(jugador?.pathFoto),
    },
    teams,
    selectedTeamId,
    actas: playerActas,
    matchesById,
    teamsById,
    allInscripciones,
    isFavorite: favoritos.some((favorito) => toId(favorito?.jugadorId) === toId(jugadorId) && !favorito?.equipoId),
  };
}

export function getSelectedTeamView(detailData, selectedTeamId) {
  if (!detailData) {
    return null;
  }

  const teamId = toId(selectedTeamId) ?? toId(detailData.selectedTeamId) ?? toId(detailData.teams?.[0]?.id);
  if (teamId === null) {
    return null;
  }

  const filteredActas = safeArray(detailData.actas).filter((acta) => toId(acta?.equipoId) === teamId);
  const playerTotals = aggregateTotals(filteredActas);

  const teamInscripcion = safeArray(detailData.allInscripciones).find((inscripcion) => toId(inscripcion?.equipoId) === teamId);
  const divisionName = teamInscripcion?.nombreDivision;
  const divisionTeamIds = getTeamIdsByDivision(detailData.allInscripciones, divisionName);

  const divisionActas = safeArray(detailData.actas).filter((acta) => divisionTeamIds.includes(toId(acta?.equipoId)));
  const divisionTotals = aggregateTotals(divisionActas);

  const summary = buildSummary(playerTotals);
  const totalsCards = buildTotalsMetrics(playerTotals, divisionTotals);

  const actaTotals = buildActaTotals(playerTotals);
  const actaAverages = buildActaAverages(playerTotals);
  const matchRows = filteredActas
    .map((acta) =>
      toMatchRow({
        acta,
        match: detailData.matchesById.get(acta?.partidoId),
        selectedTeamId: teamId,
        teamsById: detailData.teamsById,
      })
    )
    .sort((a, b) => b.sortValue - a.sortValue);

  return {
    summary,
    totalsCards,
    actaTotals,
    actaAverages,
    matchRows,
  };
}
