import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchPartidoEspectado } from '../services/partidoEspectadoService';
import { buildAbsoluteAssetUrl, toSafeNumber } from '../services/serviceUtils';

const backgroundImage = require('../assets/Fondo_Cancha.png');
const appLogo = require('../assets/LogoClutch.png');

const LIVE_TAB = 'live';
const STATS_TAB = 'stats';
const BEST_TAB = 'best';
const COMPARE_TAB = 'compare';

const STAT_OPTIONS = [
  { key: 'puntos', label: 'PTS' },
  { key: 'minutosJugados', label: 'MIN' },
  { key: 'valoracion', label: 'VAL' },
  { key: 't2Anotados', label: 'T2A' },
  { key: 'triplesAnotados', label: 'T3A' },
  { key: 'rebotes', label: 'REB' },
  { key: 'robos', label: 'ROB' },
  { key: 'tapones', label: 'TAP' },
  { key: 'perdida', label: 'PER' },
  { key: 'falta', label: 'FAL' },
];

const EVENT_LABELS = {
  T2: 'Canasta de 2',
  T3: 'Triple',
  TL: 'Tiro libre',
  ROBO: 'Robo',
  REBOTE: 'Rebote',
  TAPON: 'Tapón',
  PERDIDA: 'Pérdida',
  FALTA: 'Falta',
  TIEMPO_MUERTO: 'Tiempo muerto',
  ENTRADA: 'Entra a pista',
  SALIDA: 'Sale de pista',
};

const toFullName = (jugador) => [jugador?.nombre, jugador?.primerApellido, jugador?.segundoApellido].filter(Boolean).join(' ');
const toEventSeconds = (event) => {
  const minute = toSafeNumber(event?.minuto);
  const second = toSafeNumber(event?.segundo);

  // Compatibilidad con payloads antiguos donde `segundo` ya viene en segundos acumulados.
  if (!minute && second >= 60) {
    return second;
  }

  return (minute * 60) + second;
};
const formatClock = (seconds = 0) => `${Math.floor(toSafeNumber(seconds) / 60)}:${String(Math.max(0, toSafeNumber(seconds) % 60)).padStart(2, '0')}`;

const calcPct = (made, att) => {
  if (!att) return '0%';
  return `${((toSafeNumber(made) / toSafeNumber(att)) * 100).toFixed(2)}%`;
};

export default function PartidoEspectadoScreen({ user, partido, onGoProfile, onGoBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [sourceTag, setSourceTag] = useState('');
  const [activeTab, setActiveTab] = useState(LIVE_TAB);
  const [activeTeamStats, setActiveTeamStats] = useState('local');
  const [selectedBestStat, setSelectedBestStat] = useState(STAT_OPTIONS[0].key);

  const partidoId = partido?.id;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!partidoId) {
        setError('No se encontró el partido.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetchPartidoEspectado(partidoId);
        if (!mounted) return;
        setData(response);
        setSourceTag(response.source === 'cache' ? 'Mostrando caché' : 'Actualizado');
        setError('');
      } catch (loadError) {
        if (!mounted) return;
        setError('No se pudo cargar el partido en directo.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [partidoId]);

  const match = data?.estado?.partido || partido;
  const actas = data?.estado?.actas || [];
  const historial = data?.estado?.historial || [];

  const playersById = useMemo(() => {
    const map = new Map();
    const allPlayers = [
      ...(match?.equipoLocal?.jugadores || []),
      ...(match?.equipoVisitante?.jugadores || []),
    ];

    allPlayers.forEach((jugador) => {
      map.set(String(jugador?.id), {
        ...jugador,
        nombreCompleto: jugador?.nombreCompleto || toFullName(jugador) || 'Jugador',
        pathFoto: buildAbsoluteAssetUrl(jugador?.pathFoto),
      });
    });

    return map;
  }, [match?.equipoLocal?.jugadores, match?.equipoVisitante?.jugadores]);

  const teamIds = {
    local: String(match?.equipoLocal?.id || ''),
    visitante: String(match?.equipoVisitante?.id || ''),
  };

  const onCourtByTeam = useMemo(() => {
    const result = new Map();

    [...historial]
      .sort((a, b) => toSafeNumber(a?.periodo) - toSafeNumber(b?.periodo) || toEventSeconds(a) - toEventSeconds(b))
      .forEach((evt) => {
        if (!evt?.equipoId || !evt?.jugadorId) return;
        if (!result.has(String(evt.equipoId))) {
          result.set(String(evt.equipoId), new Set());
        }

        const teamSet = result.get(String(evt.equipoId));
        if (evt?.tipoEvento === 'ENTRADA') {
          teamSet.add(String(evt.jugadorId));
        } else if (evt?.tipoEvento === 'SALIDA') {
          teamSet.delete(String(evt.jugadorId));
        }
      });

    return result;
  }, [historial]);

  const lastEvent = useMemo(() => {
    if (!historial.length) return null;
    return [...historial].sort((a, b) => toSafeNumber(b?.periodo) - toSafeNumber(a?.periodo) || toEventSeconds(b) - toEventSeconds(a))[0];
  }, [historial]);

  const actasByTeam = useMemo(() => ({
    local: actas.filter((a) => String(a?.equipoId) === teamIds.local),
    visitante: actas.filter((a) => String(a?.equipoId) === teamIds.visitante),
  }), [actas, teamIds.local, teamIds.visitante]);

  const dorsalByPlayerTeam = useMemo(() => {
    const map = new Map();
    actas.forEach((acta) => {
      map.set(`${String(acta?.equipoId)}-${String(acta?.jugadorId)}`, toSafeNumber(acta?.dorsal));
    });
    return map;
  }, [actas]);

  const getPlayerDorsal = (jugadorId, equipoId) => {
    const dorsalFromActa = dorsalByPlayerTeam.get(`${String(equipoId)}-${String(jugadorId)}`);
    if (dorsalFromActa !== undefined) return dorsalFromActa;
    return toSafeNumber(playersById.get(String(jugadorId))?.dorsal);
  };

  const liveEvents = useMemo(() => [...historial].sort((a, b) => toSafeNumber(b?.periodo) - toSafeNumber(a?.periodo) || toEventSeconds(b) - toEventSeconds(a)), [historial]);

  const totalsByTeam = useMemo(() => {
    const base = (list) => list.reduce((acc, row) => {
      const safe = row || {};
      acc.t2Made += toSafeNumber(safe.t2Anotados);
      acc.t2Att += toSafeNumber(safe.t2Tirados);
      acc.t3Made += toSafeNumber(safe.triplesAnotados);
      acc.t3Att += toSafeNumber(safe.triplesTirados);
      acc.tlMade += toSafeNumber(safe.tlAnotados);
      acc.tlAtt += toSafeNumber(safe.tlTirados);
      acc.reb += toSafeNumber(safe.rebotes);
      acc.tap += toSafeNumber(safe.tapones);
      acc.loss += toSafeNumber(safe.perdida);
      acc.foul += toSafeNumber(safe.falta);
      return acc;
    }, { t2Made: 0, t2Att: 0, t3Made: 0, t3Att: 0, tlMade: 0, tlAtt: 0, reb: 0, tap: 0, loss: 0, foul: 0 });

    return {
      local: base(actasByTeam.local),
      visitante: base(actasByTeam.visitante),
    };
  }, [actasByTeam.local, actasByTeam.visitante]);

  const rankedPlayers = useMemo(() => {
    const rank = (list) => [...list]
      .map((acta) => {
        const player = playersById.get(String(acta?.jugadorId));
        return {
          ...acta,
          nombre: player?.nombreCompleto || `Jugador ${acta?.jugadorId || ''}`,
          foto: player?.pathFoto || null,
          stat: toSafeNumber(acta?.[selectedBestStat]),
        };
      })
      .sort((a, b) => b.stat - a.stat);

    return {
      local: rank(actasByTeam.local),
      visitante: rank(actasByTeam.visitante),
    };
  }, [actasByTeam.local, actasByTeam.visitante, playersById, selectedBestStat]);

  const TeamBadge = ({ side }) => {
    const team = side === 'local' ? match?.equipoLocal : match?.equipoVisitante;
    return (
      <View style={styles.teamColumn}>
        {team?.urlEscudo ? <Image source={{ uri: team.urlEscudo }} style={styles.logo} /> : <Image source={appLogo} style={styles.logo} />}
        <Text style={styles.teamName}>{team?.nombreEquipo || (side === 'local' ? 'Local' : 'Visitante')}</Text>
      </View>
    );
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.headerLeft} onPress={onGoProfile}>
            <Image source={appLogo} style={styles.headerLogo} />
            <Text style={styles.headerUser}>{user?.apodo || 'Usuario'}</Text>
          </Pressable>
          <Pressable onPress={onGoBack}><Text style={styles.backText}>Volver</Text></Pressable>
        </View>

        {loading ? <ActivityIndicator color="#FFF" size="large" /> : null}
        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !error ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.scoreCard}>
              <Text style={styles.topLine}>Q{match?.periodoActual || 1} - {lastEvent ? formatClock(toEventSeconds(lastEvent)) : '0:00'}</Text>
              <View style={styles.mainScoreRow}>
                <TeamBadge side="local" />
                <Text style={styles.score}>{toSafeNumber(match?.puntosLocal)} - {toSafeNumber(match?.puntosVisitante)}</Text>
                <TeamBadge side="visitante" />
              </View>
              <View style={styles.parcialesWrap}>
                {(match?.parciales || []).map((parcial) => (
                  <Text key={String(parcial?.periodo)} style={styles.parcialText}>Q{parcial?.periodo}: {toSafeNumber(parcial?.puntosLocal)}-{toSafeNumber(parcial?.puntosVisitante)}</Text>
                ))}
              </View>
              <Text style={styles.cacheTag}>{sourceTag}</Text>
            </View>

            <View style={styles.tabs}>
              {[
                { key: LIVE_TAB, label: 'Live' },
                { key: STATS_TAB, label: 'Estadísticas' },
                { key: BEST_TAB, label: 'Mejores jugadores' },
                { key: COMPARE_TAB, label: 'Comparativa' },
              ].map((tab) => (
                <Pressable key={tab.key} style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]} onPress={() => setActiveTab(tab.key)}>
                  <Text style={styles.tabText}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {activeTab === LIVE_TAB ? liveEvents.map((evt, index) => {
              const isLocal = String(evt?.equipoId) === teamIds.local;
              const player = playersById.get(String(evt?.jugadorId));
              return (
                <View key={`${evt?.id || index}`} style={[styles.eventCard, { backgroundColor: isLocal ? '#1E90FF' : '#FF5252', alignSelf: isLocal ? 'flex-start' : 'flex-end' }]}>
                  {player?.pathFoto ? <Image source={{ uri: player.pathFoto }} style={styles.playerPhoto} /> : <Image source={appLogo} style={styles.playerPhoto} />}
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{EVENT_LABELS[evt?.tipoEvento] || evt?.tipoEvento}</Text>
                    <Text style={styles.eventSub}>{player?.nombreCompleto || 'Jugador'} · #{getPlayerDorsal(evt?.jugadorId, evt?.equipoId)}</Text>
                    <Text style={styles.eventTime}>Q{evt?.periodo || 1} - {formatClock(toEventSeconds(evt))}</Text>
                  </View>
                  <Text style={styles.eventIcon}>🏀</Text>
                </View>
              );
            }) : null}

            {activeTab === STATS_TAB ? (
              <View style={styles.panel}>
                <View style={styles.teamSwitch}>
                  <Pressable style={[styles.shieldBtn, activeTeamStats === 'local' && styles.shieldBtnActive]} onPress={() => setActiveTeamStats('local')}>
                    <Text style={styles.shieldBtnText}>{match?.equipoLocal?.nombreEquipo || 'Local'}</Text>
                  </Pressable>
                  <Pressable style={[styles.shieldBtn, activeTeamStats === 'visitante' && styles.shieldBtnActive]} onPress={() => setActiveTeamStats('visitante')}>
                    <Text style={styles.shieldBtnText}>{match?.equipoVisitante?.nombreEquipo || 'Visitante'}</Text>
                  </Pressable>
                </View>

                <View style={styles.tableHeader}>
                  <Text style={styles.thDorsal}>D</Text><Text style={styles.thName}>Jugador</Text><Text style={styles.th}>MIN</Text><Text style={styles.th}>PTS</Text><Text style={styles.th}>T2</Text><Text style={styles.th}>T3</Text><Text style={styles.th}>TL</Text>
                </View>
                {(activeTeamStats === 'local' ? actasByTeam.local : actasByTeam.visitante).map((row) => {
                  const player = playersById.get(String(row?.jugadorId));
                  const onCourt = onCourtByTeam.get(String(row?.equipoId))?.has(String(row?.jugadorId));
                  return (
                    <View key={String(row?.id)} style={[styles.tr, onCourt && styles.trOnCourt]}>
                      <Text style={styles.tdDorsal}>{getPlayerDorsal(row?.jugadorId, row?.equipoId)}</Text>
                      <Text style={styles.tdName} numberOfLines={1}>{player?.nombreCompleto || `Jugador ${row?.jugadorId || ''}`}</Text>
                      <Text style={styles.td}>{toSafeNumber(row?.minutosJugados)}</Text>
                      <Text style={styles.td}>{toSafeNumber(row?.puntos)}</Text>
                      <Text style={styles.td}>{toSafeNumber(row?.t2Anotados)}/{toSafeNumber(row?.t2Tirados)}</Text>
                      <Text style={styles.td}>{toSafeNumber(row?.triplesAnotados)}/{toSafeNumber(row?.triplesTirados)}</Text>
                      <Text style={styles.td}>{toSafeNumber(row?.tlAnotados)}/{toSafeNumber(row?.tlTirados)}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {activeTab === BEST_TAB ? (
              <View style={styles.panel}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsSelector}>
                  {STAT_OPTIONS.map((opt) => (
                    <Pressable key={opt.key} style={[styles.statChip, selectedBestStat === opt.key && styles.statChipActive]} onPress={() => setSelectedBestStat(opt.key)}>
                      <Text style={styles.statChipText}>{opt.label}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {['local', 'visitante'].map((side) => {
                  const team = side === 'local' ? match?.equipoLocal : match?.equipoVisitante;
                  const list = side === 'local' ? rankedPlayers.local : rankedPlayers.visitante;
                  return (
                    <View key={side}>
                      <Text style={styles.subTitle}>{team?.nombreEquipo}</Text>
                      {list.map((player, idx) => (
                        <View key={`${side}-${player?.id}`} style={[styles.bestCard, idx === 0 && styles.bestCardTop]}>
                          {player?.foto ? <Image source={{ uri: player.foto }} style={styles.bestPhoto} /> : <Image source={appLogo} style={styles.bestPhoto} />}
                          <Text style={styles.bestName}>{player?.nombre}</Text>
                          <Text style={styles.bestValue}>{player?.stat}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {activeTab === COMPARE_TAB ? (
              <View style={styles.compareCard}>
                <View style={styles.compareTop}>
                  <Text style={styles.compareTeam}>{match?.equipoLocal?.nombreEquipo || 'Local'}</Text>
                  <Text style={styles.compareTeam}>{match?.equipoVisitante?.nombreEquipo || 'Visitante'}</Text>
                </View>
                {[
                  { label: 'T2', l: `${totalsByTeam.local.t2Made}/${totalsByTeam.local.t2Att}`, r: `${totalsByTeam.visitante.t2Made}/${totalsByTeam.visitante.t2Att}` },
                  { label: '%T2', l: calcPct(totalsByTeam.local.t2Made, totalsByTeam.local.t2Att), r: calcPct(totalsByTeam.visitante.t2Made, totalsByTeam.visitante.t2Att) },
                  { label: 'T3', l: `${totalsByTeam.local.t3Made}/${totalsByTeam.local.t3Att}`, r: `${totalsByTeam.visitante.t3Made}/${totalsByTeam.visitante.t3Att}` },
                  { label: '%T3', l: calcPct(totalsByTeam.local.t3Made, totalsByTeam.local.t3Att), r: calcPct(totalsByTeam.visitante.t3Made, totalsByTeam.visitante.t3Att) },
                  { label: 'TL', l: `${totalsByTeam.local.tlMade}/${totalsByTeam.local.tlAtt}`, r: `${totalsByTeam.visitante.tlMade}/${totalsByTeam.visitante.tlAtt}` },
                  { label: '%TL', l: calcPct(totalsByTeam.local.tlMade, totalsByTeam.local.tlAtt), r: calcPct(totalsByTeam.visitante.tlMade, totalsByTeam.visitante.tlAtt) },
                  { label: 'Rebotes', l: totalsByTeam.local.reb, r: totalsByTeam.visitante.reb },
                  { label: 'Tapones', l: totalsByTeam.local.tap, r: totalsByTeam.visitante.tap },
                  { label: 'Pérdidas', l: totalsByTeam.local.loss, r: totalsByTeam.visitante.loss },
                  { label: 'Faltas', l: totalsByTeam.local.foul, r: totalsByTeam.visitante.foul },
                ].map((row) => (
                  <View key={row.label} style={styles.compareRow}>
                    <Text style={styles.compareValue}>{row.l}</Text>
                    <Text style={styles.compareLabel}>{row.label}</Text>
                    <Text style={styles.compareValue}>{row.r}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  headerLogo: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF' },
  headerUser: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  backText: { color: '#FFF', fontWeight: '700' },
  content: { paddingBottom: 30, gap: 12 },
  scoreCard: { backgroundColor: '#14253E', borderRadius: 18, padding: 10 },
  topLine: { color: '#FFF', textAlign: 'center', fontWeight: '700' },
  mainScoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamColumn: { width: '28%', alignItems: 'center' },
  logo: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFF' },
  teamName: { color: '#FFF', fontWeight: '700', textAlign: 'center' },
  score: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  parcialesWrap: { marginTop: 8, alignItems: 'center', gap: 2 },
  parcialText: { color: '#D5E6FF', fontWeight: '600' },
  cacheTag: { marginTop: 4, color: '#7BFFB8', textAlign: 'center', fontSize: 12 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  tabBtn: { backgroundColor: '#243B5C', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  tabBtnActive: { backgroundColor: '#00AEEF' },
  tabText: { color: '#FFF', fontWeight: '700' },
  eventCard: { width: '96%', borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerPhoto: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF' },
  eventInfo: { flex: 1 },
  eventTitle: { color: '#000', fontWeight: '900', fontSize: 20 },
  eventSub: { color: '#FFF', fontWeight: '600' },
  eventTime: { color: '#EAF3FF', fontWeight: '700' },
  eventIcon: { fontSize: 26 },
  panel: { backgroundColor: '#13263D', borderRadius: 14, padding: 10, gap: 8 },
  teamSwitch: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  shieldBtn: { backgroundColor: '#2D4368', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  shieldBtnActive: { backgroundColor: '#00AEEF' },
  shieldBtnText: { color: '#FFF', fontWeight: '700' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#FFFFFF44', paddingBottom: 5, alignItems: 'center' },
  thDorsal: { width: 28, color: '#FFF', fontWeight: '800' },
  thName: { flex: 1, color: '#FFF', fontWeight: '800' },
  th: { width: 48, color: '#FFF', fontWeight: '800', textAlign: 'center', fontSize: 12 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#FFFFFF14' },
  trOnCourt: { backgroundColor: '#2B4E76' },
  tdDorsal: { width: 28, color: '#FF4B4B', fontWeight: '800' },
  tdName: { flex: 1, color: '#FFF' },
  td: { width: 48, color: '#FFF', textAlign: 'center', fontSize: 12 },
  statsSelector: { gap: 8 },
  statChip: { backgroundColor: '#2D4368', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 7 },
  statChipActive: { backgroundColor: '#00AEEF' },
  statChipText: { color: '#FFF', fontWeight: '700' },
  subTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 8 },
  bestCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1F3352', borderRadius: 8, padding: 7, marginBottom: 6 },
  bestCardTop: { minHeight: 76 },
  bestPhoto: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF' },
  bestName: { flex: 1, color: '#FFF', fontWeight: '700' },
  bestValue: { color: '#FFF', fontWeight: '900', fontSize: 20 },
  compareCard: { backgroundColor: '#13263D', borderRadius: 14, padding: 12, gap: 8 },
  compareTop: { flexDirection: 'row', justifyContent: 'space-between' },
  compareTeam: { color: '#FFF', fontWeight: '800', width: '44%', textAlign: 'center' },
  compareRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#FFFFFF22', paddingVertical: 6 },
  compareValue: { color: '#FFF', width: '32%', textAlign: 'center', fontWeight: '700' },
  compareLabel: { color: '#FF4B4B', width: '36%', textAlign: 'center', fontWeight: '800' },
  error: { color: '#FFD4D4', textAlign: 'center', marginTop: 20, fontWeight: '700' },
});
