import { API_ASSETS_BASE_URL, API_BASE_URL, parseResponse } from './apiConfig';

const EQUIPOS_URL = `${API_BASE_URL}/equipos`;
const INSCRIPCIONES_URL = `${API_BASE_URL}/inscripciones`;
const PARTIDOS_URL = `${API_BASE_URL}/partidos`;

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

const getPlayerDisplayName = (player) =>
  [player?.nombre, player?.primerApellido, player?.segundoApellido]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Jugador';

const getCoachDisplayName = (coach) => {
  if (!coach || typeof coach !== 'object') {
    return '';
  }

  const nestedCoach = coach?.entrenador && typeof coach.entrenador === 'object' ? coach.entrenador : null;
  const source = nestedCoach || coach;

  return [source?.nombre, source?.primerApellido].filter(Boolean).join(' ').trim();
};

const extractCoachNames = (equipo = {}) => {
  const coaches = safeArray(equipo?.entrenadores)
    .map(getCoachDisplayName)
    .filter(Boolean);

  const firstCoach =
    coaches[0]
    || equipo?.primerEntrenador
    || equipo?.entrenadorPrincipal
    || equipo?.nombrePrimerEntrenador
    || equipo?.coachPrincipal
    || 'Sin asignar';

  const secondCoach =
    coaches[1]
    || equipo?.segundoEntrenador
    || equipo?.entrenadorAuxiliar
    || equipo?.nombreSegundoEntrenador
    || equipo?.assistantCoach
    || 'Sin asignar';

  return {
    firstCoach,
    secondCoach,
  };
};

async function fetchJson(url, options = undefined) {
  const response = await fetch(url, options);
  return parseResponse(response);
}

export async function fetchPartidoById(partidoId) {
  const response = await fetchJson(`${PARTIDOS_URL}/${partidoId}`);

  if (!response.ok) {
    throw new Error('No se pudo cargar el partido seleccionado.');
  }

  return response.data;
}

export async function fetchEquipoById(equipoId) {
  const response = await fetchJson(`${EQUIPOS_URL}/${equipoId}`);

  if (!response.ok) {
    throw new Error('No se pudo cargar la información del equipo.');
  }

  return response.data;
}

export async function fetchInscripcionesByEquipo(equipoId) {
  const response = await fetchJson(INSCRIPCIONES_URL);

  if (!response.ok) {
    throw new Error('No se pudieron cargar las inscripciones del equipo.');
  }

  return safeArray(response.data).filter((row) => String(row?.equipoId) === String(equipoId));
}

export async function fetchInitialMatchSetup(selectedMatch) {
  const selectedMatchId = selectedMatch?.id;
  const partido = await fetchPartidoById(selectedMatchId);

  const localId = partido?.equipoLocal?.id || selectedMatch?.equipoLocal?.id || selectedMatch?.localId;
  const visitanteId = partido?.equipoVisitante?.id || selectedMatch?.equipoVisitante?.id || selectedMatch?.visitanteId;

  if (!localId || !visitanteId) {
    throw new Error('El partido no contiene los equipos local y visitante.');
  }

  const [equipoLocal, equipoVisitante, inscripcionesLocal, inscripcionesVisitante] = await Promise.all([
    fetchEquipoById(localId),
    fetchEquipoById(visitanteId),
    fetchInscripcionesByEquipo(localId),
    fetchInscripcionesByEquipo(visitanteId),
  ]);

  return {
    partido: {
      ...partido,
      id: partido?.id || selectedMatchId,
      fechaHoraInicio: partido?.fechaHoraInicio || selectedMatch?.fechaHoraInicio,
      equipoLocal: partido?.equipoLocal || selectedMatch?.equipoLocal,
      equipoVisitante: partido?.equipoVisitante || selectedMatch?.equipoVisitante,
    },
    local: {
      ...equipoLocal,
      urlEscudo: buildAbsoluteAssetUrl(equipoLocal?.urlEscudo || partido?.equipoLocal?.urlEscudo),
      coaches: extractCoachNames(equipoLocal),
      inscripciones: inscripcionesLocal,
      jugadoresDisponibles: safeArray(equipoLocal?.jugadores).map((player) => ({
        ...player,
        nombreCompleto: getPlayerDisplayName(player),
      })),
    },
    visitante: {
      ...equipoVisitante,
      urlEscudo: buildAbsoluteAssetUrl(equipoVisitante?.urlEscudo || partido?.equipoVisitante?.urlEscudo),
      coaches: extractCoachNames(equipoVisitante),
      inscripciones: inscripcionesVisitante,
      jugadoresDisponibles: safeArray(equipoVisitante?.jugadores).map((player) => ({
        ...player,
        nombreCompleto: getPlayerDisplayName(player),
      })),
    },
  };
}

export function formatTimeUntilStart(dateValue, nowMs = Date.now()) {
  const date = new Date(dateValue || '');

  if (Number.isNaN(date.getTime())) {
    return 'Hora de inicio no disponible';
  }

  const diffMs = date.getTime() - nowMs;

  if (diffMs <= 0) {
    return 'El partido ya puede iniciar';
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `Faltan ${minutes} min`;
  }

  return `Faltan ${hours} h ${minutes} min`;
}

export function normalizeConvocados(convocados, equipoId) {
  return safeArray(convocados)
    .filter((row) => row?.jugadorId)
    .map((row) => ({
      equipoId,
      jugadorId: row.jugadorId,
      dorsal: row.dorsal,
      titular: Boolean(row.titular),
    }));
}

export async function initializeActa({
  partidoId,
  equipoLocalId,
  equipoVisitanteId,
  localConvocados,
  visitanteConvocados,
}) {
  const body = {
    convocados: [
      ...normalizeConvocados(localConvocados, equipoLocalId),
      ...normalizeConvocados(visitanteConvocados, equipoVisitanteId),
    ],
  };

  const response = await fetchJson(`${PARTIDOS_URL}/${partidoId}/actas/inicializar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('No se pudo inicializar el acta del partido.');
  }

  return response.data;
}

export async function startFirstPeriod({ partidoId }) {
  const body = {
    periodo: 1,
    minuto: 0,
  };

  const response = await fetchJson(`${PARTIDOS_URL}/${partidoId}/iniciar-periodo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('No se pudo iniciar el primer periodo del partido.');
  }

  return response.data;
}
