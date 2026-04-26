import { API_BASE_URL } from './apiConfig';
import { buildAbsoluteAssetUrl, fetchJson, safeArray, toSafeNumber } from './serviceUtils';

const PARTIDOS_URL = `${API_BASE_URL}/partidos`;

// Claves inspiradas en @Cacheable(value = "estadoPartido", key = "#partidoId") de PartidoService.java
const CACHE_NAMESPACE_ESTADO = 'estadoPartido';
const CACHE_NAMESPACE_PARTIDOS = 'partidos';

const uiCache = new Map();

const buildCacheKey = (namespace, id) => `${namespace}:${String(id)}`;

const getCached = (key) => uiCache.get(key) || null;

const setCached = (key, value) => {
  uiCache.set(key, { ...value, cachedAt: Date.now() });
};

const mapTeam = (team, fallbackName) => ({
  ...team,
  nombreEquipo: team?.nombreEquipo || fallbackName,
  urlEscudo: buildAbsoluteAssetUrl(team?.urlEscudo),
});

const mapPartido = (partido) => ({
  ...partido,
  equipoLocal: mapTeam(partido?.equipoLocal, 'Local'),
  equipoVisitante: mapTeam(partido?.equipoVisitante, 'Visitante'),
  puntosLocal: toSafeNumber(partido?.puntosLocal),
  puntosVisitante: toSafeNumber(partido?.puntosVisitante),
  parciales: safeArray(partido?.parciales),
});

const mapEstado = (estado) => {
  const partido = mapPartido(estado?.partido || {});
  const actas = safeArray(estado?.actas);
  const historial = safeArray(estado?.historial).map((evento) => ({ ...evento }));

  return {
    ...estado,
    partido,
    actas,
    historial,
  };
};

export async function fetchPartidoEspectado(partidoId) {
  const estadoKey = buildCacheKey(CACHE_NAMESPACE_ESTADO, partidoId);
  const partidosKey = buildCacheKey(CACHE_NAMESPACE_PARTIDOS, 'list');

  const [estadoResponse, partidosResponse] = await Promise.all([
    fetchJson(`${PARTIDOS_URL}/${partidoId}/estado`),
    fetchJson(PARTIDOS_URL),
  ]);

  const rawEstado = estadoResponse.ok ? mapEstado(estadoResponse.data) : null;
  if (rawEstado) {
    setCached(estadoKey, { data: rawEstado });
  }

  const rawPartidos = partidosResponse.ok ? safeArray(partidosResponse.data).map(mapPartido) : null;
  if (rawPartidos) {
    setCached(partidosKey, { data: rawPartidos });
  }

  const cachedEstado = getCached(estadoKey);
  const cachedPartidos = getCached(partidosKey);

  if (!rawEstado && !cachedEstado) {
    throw new Error('No se pudo cargar el estado del partido en directo.');
  }

  const estado = rawEstado || cachedEstado?.data;
  const partidos = rawPartidos || cachedPartidos?.data || [];

  return {
    estado,
    partidos,
    source: rawEstado ? 'network' : 'cache',
  };
}
