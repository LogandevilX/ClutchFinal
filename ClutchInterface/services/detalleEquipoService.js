import { API_ASSETS_BASE_URL, API_BASE_URL, parseResponse } from './apiConfig';

const FAVORITOS_URL = `${API_BASE_URL}/favoritos`;
const EQUIPOS_URL = `${API_BASE_URL}/equipos`;
const PARTIDOS_URL = `${API_BASE_URL}/partidos`;
const INSCRIPCIONES_URL = `${API_BASE_URL}/inscripciones`;

const safeArray = (value) => (Array.isArray(value) ? value : []);

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDateValue = (value) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const toDate = (value) => {
  const parsed = value ? new Date(value) : null;
  return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

const formatDate = (value) => {
  const date = toDate(value);

  if (!date) {
    return 'Sin fecha';
  }

  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
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

const buildGroupsByPhase = (inscripciones, divisionName) => {
  const groupsByPhase = {};

  safeArray(inscripciones)
    .filter((entry) => entry?.nombreDivision === divisionName && entry?.faseId)
    .forEach((entry) => {
      if (!groupsByPhase[entry.faseId]) {
        groupsByPhase[entry.faseId] = [];
      }

      const alreadyExists = groupsByPhase[entry.faseId].some((group) => group.grupoId === entry.grupoId);

      if (!alreadyExists) {
        groupsByPhase[entry.faseId].push({
          grupoId: entry.grupoId,
          nombreGrupo: entry.nombreGrupo || `Grupo ${entry.grupoId}`,
        });
      }
    });

  return groupsByPhase;
};

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
  const divisionName = currentInscripcion?.nombreDivision || null;
  const sameDivisionEntries = inscripciones.filter((entry) => entry?.nombreDivision === divisionName);
  const sameDivisionTeamIds = new Set(
    sameDivisionEntries.map((entry) => entry?.equipoId).filter((id) => typeof id === 'number')
  );

  const classification = allTeams
    .map((entry) => {
      const inscripcionEquipo = sameDivisionEntries.find((inscripcion) => inscripcion?.equipoId === entry?.id);

      if (!inscripcionEquipo) {
        return null;
      }

      return {
        ...entry,
        urlEscudo: buildAbsoluteAssetUrl(entry?.urlEscudo),
        faseId: inscripcionEquipo?.faseId || null,
        grupoId: inscripcionEquipo?.grupoId || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const positionDiff = toSafeNumber(a?.posicion) - toSafeNumber(b?.posicion);

      if (positionDiff !== 0) {
        return positionDiff;
      }

      return toSafeNumber(b?.puntos) - toSafeNumber(a?.puntos);
    });

  const phases = Array.from(
    new Map(
      sameDivisionEntries.map((entry) => [entry.faseId, { faseId: entry.faseId, nombreFase: entry.faseActual || `Fase ${entry.faseId}` }])
    ).values()
  );

  const groupsByPhase = buildGroupsByPhase(inscripciones, divisionName);

  const divisionMatches = allMatches
    .filter((match) => {
      const localId = match?.equipoLocal?.id;
      const awayId = match?.equipoVisitante?.id;
      return sameDivisionTeamIds.has(localId) && sameDivisionTeamIds.has(awayId);
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
    matches: divisionMatches,
    isFavorite: favoritos.some((favorito) => favorito?.equipoId === equipoId && !favorito?.jugadorId),
  };
}

export const getDefaultPhaseId = (detailData) => {
  const selectedId = detailData?.team?.inscripcion?.faseId;

  if (selectedId && detailData?.groupsByPhase?.[selectedId]) {
    return selectedId;
  }

  return detailData?.phases?.[0]?.faseId || null;
};

export const getDefaultGroupId = (detailData, phaseId) => {
  const selectedGroupId = detailData?.team?.inscripcion?.grupoId;
  const groups = detailData?.groupsByPhase?.[phaseId] || [];

  if (groups.some((group) => String(group.grupoId) === String(selectedGroupId))) {
    return selectedGroupId;
  }

  return groups[0]?.grupoId || null;
};

export const getAvailableGroups = (detailData, selectedPhaseId) => detailData?.groupsByPhase?.[selectedPhaseId] || [];

export const getFilteredClassification = (detailData, selectedPhaseId, selectedGroupId) =>
  (detailData?.classification || []).filter((team) => {
    if (selectedPhaseId && String(team?.faseId ?? '') !== String(selectedPhaseId)) {
      return false;
    }

    if (selectedGroupId && String(team?.grupoId ?? '') !== String(selectedGroupId)) {
      return false;
    }

    return true;
  });

export const getGroupedMatches = (detailData, selectedPhaseId, selectedGroupId) => {
  const selectedPhaseGroupIds = new Set((detailData?.groupsByPhase?.[selectedPhaseId] || []).map((group) => String(group.grupoId)));

  const filteredMatches = (detailData?.matches || []).filter((match) => {
    if (selectedPhaseId && selectedPhaseGroupIds.size > 0 && !selectedPhaseGroupIds.has(String(match?.grupoId))) {
      return false;
    }

    if (selectedGroupId && String(match?.grupoId) !== String(selectedGroupId)) {
      return false;
    }

    return true;
  });

  const jornadasMap = new Map();

  filteredMatches.forEach((match) => {
    const jornadaNumber = Number(match?.jornada);
    const hasValidJornada = Number.isFinite(jornadaNumber) && jornadaNumber > 0;
    const date = toDate(match?.fechaHoraInicio);
    const jornadaKey = hasValidJornada ? `jornada-${jornadaNumber}` : 'jornada-sin-asignar';
    const jornadaLabel = hasValidJornada ? `Jornada ${jornadaNumber}` : 'Jornada sin asignar';
    const dateLabel = formatDate(match?.fechaHoraInicio);

    if (!jornadasMap.has(jornadaKey)) {
      jornadasMap.set(jornadaKey, {
        key: jornadaKey,
        label: jornadaLabel,
        sortValue: hasValidJornada ? jornadaNumber : Number.MAX_SAFE_INTEGER,
        dates: new Map(),
      });
    }

    const jornada = jornadasMap.get(jornadaKey);

    if (!jornada.dates.has(dateLabel)) {
      jornada.dates.set(dateLabel, []);
    }

    jornada.dates.get(dateLabel).push(match);
  });

  return Array.from(jornadasMap.values())
    .sort((a, b) => a.sortValue - b.sortValue)
    .map((jornada) => ({
      ...jornada,
      dates: Array.from(jornada.dates.entries()).map(([dateLabel, matches]) => ({
        dateLabel,
        matches,
      })),
    }));
};
