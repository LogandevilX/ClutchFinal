import { API_BASE_URL, parseResponse } from './apiConfig';

const PARTIDOS_URL = `${API_BASE_URL}/partidos`;

const safeArray = (value) => (Array.isArray(value) ? value : []);

const formatMatchDate = (dateValue) => {
  if (!dateValue) {
    return 'Fecha no disponible';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export async function fetchPartidosAsignados(usuarioId) {
  const response = await fetch(`${PARTIDOS_URL}/usuario/${usuarioId}`);
  const parsedResponse = await parseResponse(response);

  if (!parsedResponse.ok) {
    throw new Error('No se pudieron cargar los partidos asignados al anotador.');
  }

  const partidos = safeArray(parsedResponse.data)
    .map((partido) => ({
      id: partido?.id,
      local: partido?.equipoLocal?.nombreEquipo || 'Equipo local',
      visitante: partido?.equipoVisitante?.nombreEquipo || 'Equipo visitante',
      dateMs: new Date(partido?.fechaHoraInicio || '').getTime(),
      fechaHora: formatMatchDate(partido?.fechaHoraInicio),
      pabellon: partido?.pabellonDeJuego || 'Pabellón no disponible',
      estado: partido?.estado || 'PROGRAMADO',
    }))
    .sort((firstMatch, secondMatch) => {
      const firstDate = firstMatch.dateMs;
      const secondDate = secondMatch.dateMs;

      if (!Number.isFinite(firstDate) && !Number.isFinite(secondDate)) {
        return 0;
      }

      if (!Number.isFinite(firstDate)) {
        return 1;
      }

      if (!Number.isFinite(secondDate)) {
        return -1;
      }

      return firstDate - secondDate;
    })
    .map(({ dateMs, ...match }) => match);

  return partidos;
}
