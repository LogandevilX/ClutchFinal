import { API_BASE_URL } from './apiConfig';
import { fetchJson, safeArray } from './serviceUtils';

const PARTIDOS_URL = `${API_BASE_URL}/partidos`;
const JUGADORES_URL = `${API_BASE_URL}/jugadores`;

export const SHOT_ACTIONS = {
  Triple45Iz: { tipoEvento: 'T3', posicion: 'Triple45Iz', puntos: 3 },
  TripleCabecera: { tipoEvento: 'T3', posicion: 'TripleCabecera', puntos: 3 },
  Triple45Der: { tipoEvento: 'T3', posicion: 'Triple45Der', puntos: 3 },
  TripleEsquinaIz: { tipoEvento: 'T3', posicion: 'TripleEsquinaIz', puntos: 3 },
  TripleEsquinaDerecha: { tipoEvento: 'T3', posicion: 'TripleEsquinaDerecha', puntos: 3 },
  CuarentaCincoIz: { tipoEvento: 'T2', posicion: '45Iz', puntos: 2 },
  Cabecera: { tipoEvento: 'T2', posicion: 'Cabecera', puntos: 2 },
  CuarentaCincoDer: { tipoEvento: 'T2', posicion: '45Der', puntos: 2 },
  Pintura: { tipoEvento: 'T2', posicion: 'Pintura', puntos: 2 },
  EsquinaIz: { tipoEvento: 'T2', posicion: 'EsquinaIz', puntos: 2 },
  EsquinaDer: { tipoEvento: 'T2', posicion: 'EsquinaDer', puntos: 2 },
};

export const DEFENSIVE_ACTIONS = ['ROBO', 'REBOTE', 'TAPON', 'PERDIDA'];

export async function fetchMatchState(partidoId) {
  const response = await fetchJson(`${PARTIDOS_URL}/${partidoId}/estado`);

  if (!response.ok) {
    throw new Error('No se pudo cargar el estado del partido.');
  }

  return response.data;
}

export async function finishPeriod(partidoId) {
  const response = await fetchJson(`${PARTIDOS_URL}/${partidoId}/fin-periodo`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('No se pudo finalizar el periodo.');
  }

  return response.data;
}

export async function startPeriod(partidoId, { periodo, minuto = 0, titulares = [] }) {
  const response = await fetchJson(`${PARTIDOS_URL}/${partidoId}/iniciar-periodo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ periodo, minuto, titulares }),
  });

  if (!response.ok) {
    throw new Error('No se pudo iniciar el periodo.');
  }

  return response.data;
}

export async function sendEvent(partidoId, payload) {
  const body = {
    partidoId,
    equipoId: payload.equipoId,
    jugadorId: payload.jugadorId,
    tipoEvento: payload.tipoEvento,
    acierto: payload.acierto,
    periodo: payload.periodo,
    minuto: payload.minuto,
    segundo: payload.segundo,
    posicion: payload.posicion,
  };

  const response = await fetchJson(`${PARTIDOS_URL}/eventos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('No se pudo registrar el evento.');
  }

  return response.data;
}

export async function finishMatch(partidoId) {
  const response = await fetchJson(`${PARTIDOS_URL}/${partidoId}/finalizar`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('No se pudo finalizar el partido.');
  }

  return true;
}

export async function fetchPlayerActas(jugadorId) {
  const response = await fetchJson(`${JUGADORES_URL}/${jugadorId}/actas`);

  if (!response.ok) {
    throw new Error('No se pudieron cargar las actas del jugador.');
  }

  return safeArray(response.data);
}

export const formatClock = (secondsValue) => {
  const safeSeconds = Math.max(0, Number.isFinite(secondsValue) ? Math.floor(secondsValue) : 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
