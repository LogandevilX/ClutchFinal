import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  fetchPlayerDetailData,
  getSelectedTeamView,
  toggleFavoritePlayer,
} from '../services/jugadorService';

const backgroundImage = require('../assets/Fondo_Cancha2.png');
const appLogo = require('../assets/LogoClutch.png');

const tabs = [
  { key: 'totales', label: 'Estadísticas' },
  { key: 'partidos', label: 'Partidos' },
];

const tableColumns = [
  { key: 'm', label: 'M' },
  { key: 'pts', label: 'PTS' },
  { key: 'tla', label: 'TLA' },
  { key: 'tli', label: 'TLI' },
  { key: 'pctTl', label: '%TL' },
  { key: 't2a', label: 'T2A' },
  { key: 't2i', label: 'T2I' },
  { key: 'pctT2', label: '%T2' },
  { key: 't3a', label: 'T3A' },
  { key: 't3i', label: 'T3I' },
  { key: 'pctT3', label: '%T3' },
  { key: 'reb', label: 'REB' },
  { key: 'tap', label: 'TAP' },
  { key: 'rob', label: 'ROB' },
  { key: 'perd', label: 'PERD' },
  { key: 'falt', label: 'FALT' },
  { key: 'val', label: 'VAL' },
  { key: 'pm', label: '+/-' },
];

const totalsTabColumns = [
  { key: 'm', label: 'Minutos' },
  { key: 'pts', label: 'Puntos' },
  { key: 'tla', label: 'TL Anotados' },
  { key: 'tli', label: 'TL Tirados' },
  { key: 'pctTl', label: '% TL' },
  { key: 't2a', label: 'T2 Anotados' },
  { key: 't2i', label: 'T2 Tirados' },
  { key: 'pctT2', label: '% T2' },
  { key: 't3a', label: 'T3 Anotados' },
  { key: 't3i', label: 'T3 Tirados' },
  { key: 'pctT3', label: '% T3' },
  { key: 'reb', label: 'Rebotes' },
  { key: 'tap', label: 'Tapones' },
  { key: 'rob', label: 'Robos' },
  { key: 'perd', label: 'Pérdidas' },
  { key: 'falt', label: 'Faltas' },
  { key: 'val', label: 'Valoración' },
  { key: 'pm', label: '+/-' },
];

const formatValue = (value) => {
  if (!Number.isFinite(Number(value))) {
    return '0';
  }

  const normalized = Number(value);

  if (Number.isInteger(normalized)) {
    return String(normalized);
  }

  return normalized.toFixed(1);
};

const StatBlock = ({ label, value, highlightedColor }) => (
  <View style={styles.summaryStatItem}>
    <Text style={styles.summaryStatLabel}>{label}</Text>
    <Text style={[styles.summaryStatValue, highlightedColor ? { color: highlightedColor } : null]}>{formatValue(value)}</Text>
  </View>
);

const BarRow = ({ value, widthPercent, color }) => (
  <View style={styles.barTrack}>
    <View style={[styles.barFill, { width: `${Math.max(8, widthPercent * 100)}%`, backgroundColor: color }]} />
    <Text style={styles.barValueLabel}>{formatValue(value)}</Text>
  </View>
);

const TableRow = ({ label, values, highlighted }) => (
  <View style={[styles.tableRow, highlighted ? styles.tableMatchRow : null]}>
    <Text style={[styles.tableLabel, highlighted ? styles.tableLabelMatch : null]} numberOfLines={2}>{label}</Text>
    {tableColumns.map((column) => (
      <Text key={`${label}-${column.key}`} style={styles.tableCellValue}>
        {formatValue(values?.[column.key])}
      </Text>
    ))}
  </View>
);

export default function DetalleJugadorScreen({ playerId, user, onGoBack }) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('totales');
  const [detailData, setDetailData] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!playerId || !user?.id) {
        setErrorMessage('No se pudo identificar el jugador a mostrar.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage('');

      try {
        const data = await fetchPlayerDetailData({ usuarioId: user.id, jugadorId: playerId });

        if (!mounted) {
          return;
        }

        setDetailData(data);
        setSelectedTeamId(data.selectedTeamId);
      } catch (error) {
        if (mounted) {
          setErrorMessage('No se pudieron cargar los datos del jugador.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [playerId, user?.id]);

  const teamView = useMemo(() => getSelectedTeamView(detailData, selectedTeamId), [detailData, selectedTeamId]);
  const groupedMatchRows = useMemo(() => {
    const grouped = new Map();

    (teamView?.matchRows || []).forEach((row) => {
      const jornadaNumber = Number(row?.jornada);
      const hasJornada = Number.isFinite(jornadaNumber) && jornadaNumber > 0;
      const key = hasJornada ? `jornada-${jornadaNumber}` : 'jornada-sin-asignar';

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          label: hasJornada ? `Jornada ${jornadaNumber}` : 'Jornada sin asignar',
          sortValue: hasJornada ? jornadaNumber : Number.MAX_SAFE_INTEGER,
          rows: [],
        });
      }

      grouped.get(key).rows.push(row);
    });

    return Array.from(grouped.values()).sort((a, b) => a.sortValue - b.sortValue);
  }, [teamView?.matchRows]);

  const selectedTeamName = useMemo(
    () => detailData?.teams?.find((team) => Number(team.id) === Number(selectedTeamId))?.nombreEquipo || 'Sin equipo',
    [detailData, selectedTeamId]
  );

  const onToggleFavorite = async () => {
    if (!detailData || !user?.id || !playerId) {
      return;
    }

    const response = await toggleFavoritePlayer({ usuarioId: user.id, jugadorId: playerId });

    if (!response.ok) {
      setErrorMessage('No se pudo actualizar el estado de favorito.');
      return;
    }

    setDetailData((previous) => ({
      ...previous,
      isFavorite: !previous.isFavorite,
    }));
  };

  return (
    <ImageBackground source={backgroundImage} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.actionBar}>
          <Pressable style={styles.backButton} onPress={onGoBack}>
            <Text style={styles.backButtonText}>❮</Text>
          </Pressable>
          <Pressable style={styles.favoriteButton} onPress={onToggleFavorite}>
            <Text style={[styles.favoriteIcon, { color: detailData?.isFavorite ? '#ffd84d' : '#ffffff' }]}>★</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centerMessage}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : null}

        {!loading && errorMessage ? (
          <View style={styles.centerMessage}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!loading && !errorMessage && detailData && teamView ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.teamSelectorWrap}>
              <Pressable style={styles.teamSelectorButton} onPress={() => setIsTeamMenuOpen((prev) => !prev)}>
                <Text style={styles.teamSelectorText} numberOfLines={1}>{selectedTeamName}</Text>
                <Text style={styles.teamSelectorChevron}>▾</Text>
              </Pressable>
              {isTeamMenuOpen ? (
                <View style={styles.teamDropdown}>
                  {(detailData.teams || []).map((team) => (
                    <Pressable
                      key={team.id}
                      style={styles.teamDropdownItem}
                      onPress={() => {
                        setSelectedTeamId(team.id);
                        setIsTeamMenuOpen(false);
                      }}
                    >
                      <Text style={styles.teamDropdownText}>{team.nombreEquipo}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            {/* NOTA: Z-Index ajustado aquí para evitar problemas con el menú desplegable */}
            <View style={styles.playerImageWrap}>
              <Image source={detailData.player?.pathFoto ? { uri: detailData.player.pathFoto } : appLogo} style={styles.playerImage} />
              <View style={styles.nameOverlay}>
                <Text style={styles.playerName}>{(detailData.player?.nombreCompleto || 'Jugador').toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.summaryPill}>
              <StatBlock label="PJ" value={teamView.summary?.pj} />
              <StatBlock label="MPP" value={teamView.summary?.mpp} highlightedColor="#f2e84f" />
              <StatBlock label="PPP" value={teamView.summary?.ppp} highlightedColor="#ff2e3a" />
              <StatBlock label="VPP" value={teamView.summary?.vpp} />
            </View>

            <View style={styles.tabsRow}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[styles.tabButton, activeTab === tab.key ? styles.tabButtonActive : null]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={styles.tabLabel}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {activeTab === 'totales' ? (
              <View style={styles.totalsWrapCompact}>
                {totalsTabColumns.map((metric) => (
                  <View key={metric.key} style={styles.totalValueCard}>
                    <Text style={styles.totalValueLabel}>{metric.label}</Text>
                    <Text style={styles.totalValueNumber}>{formatValue(teamView.actaAverages?.[metric.key])}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {activeTab === 'partidos' ? (
              <View style={styles.matchesTableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View>
                    <View style={styles.tableHeaderRow}>
                      <Text style={styles.tableHeaderLabel} />
                      {tableColumns.map((column) => (
                        <Text key={column.key} style={styles.tableHeaderCell}>{column.label}</Text>
                      ))}
                    </View>

                    <TableRow label="Total" values={teamView.actaTotals} />

                    {groupedMatchRows.map((group) => (
                      <View key={group.key}>
                        <View style={styles.jornadaRow}>
                          <Text style={styles.jornadaText}>{group.label}</Text>
                        </View>
                        {group.rows.map((row) => (
                          <TableRow key={row.id} label={row.rival} values={row.values} highlighted />
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 20 : 20,
  },
  actionBar: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(5, 15, 29, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: { color: '#fff', fontWeight: '900', fontSize: 26, lineHeight: 26, marginRight: 2 },
  favoriteButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  favoriteIcon: { fontSize: 32 },
  centerMessage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#fff', fontWeight: '700' },
  scrollContent: { paddingBottom: 28 },
  teamSelectorWrap: { position: 'relative', zIndex: 9, elevation: 9 },
  teamSelectorButton: {
    marginHorizontal: 8,
    marginTop: 2,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#7a2226',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamSelectorText: { flex: 1, color: '#ff4a4a', fontWeight: '800', fontSize: 34 * 0.48 },
  teamSelectorChevron: { color: '#ff4a4a', fontSize: 18, marginLeft: 8 },
  teamDropdown: {
    position: 'absolute',
    top: 44,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(5,15,29,0.98)',
    borderWidth: 1,
    borderColor: '#214f84',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
    elevation: 10,
  },
  teamDropdownItem: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  teamDropdownText: { color: '#fff', fontWeight: '600' },
  playerImageWrap: {
    marginTop: 16,
    backgroundColor: '#d7d7d7',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    zIndex: -1,
    elevation: -1
  },
  playerImage: { width: '100%', height: 210, resizeMode: 'cover' },
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(44,56,69,0.86)',
    paddingVertical: 14,
  },
  playerName: { color: '#fff', textAlign: 'center', fontSize: 42 * 0.55, fontWeight: '900', letterSpacing: 0.7 },
  summaryPill: {
    marginTop: 14,
    backgroundColor: 'rgba(2, 10, 23, 0.95)',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: { alignItems: 'center', minWidth: 56 },
  summaryStatLabel: { color: '#fff', fontSize: 34 * 0.45, fontWeight: '800' },
  summaryStatValue: { marginTop: 2, color: '#fff', fontSize: 31 * 0.45, fontWeight: '900' },
  tabsRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  tabButton: {
    minWidth: 136,
    borderRadius: 18,
    backgroundColor: '#152640',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabButtonActive: { backgroundColor: '#7d2426' },
  tabLabel: { color: '#fff', fontWeight: '800', fontSize: 34 * 0.45 },
  totalsWrap: { marginTop: 14, gap: 12 },
  totalsWrapCompact: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  totalValueCard: {
    width: '48%',
    backgroundColor: 'rgba(2, 10, 23, 0.95)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  totalValueLabel: { color: '#c4d8f0', fontWeight: '700', fontSize: 13 },
  totalValueNumber: { color: '#fff', fontWeight: '900', fontSize: 20, marginTop: 4 },
  metricCard: {
    backgroundColor: 'rgba(2, 10, 23, 0.95)',
    borderRadius: 20,
    padding: 14,
  },
  metricTitle: { color: '#fff', fontWeight: '800', fontSize: 34 * 0.45, marginBottom: 10 },
  barTrack: {
    position: 'relative',
    marginBottom: 10,
    backgroundColor: '#d7d7d7',
    borderRadius: 12,
    overflow: 'hidden',
    height: 26,
    justifyContent: 'center',
  },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 12 },
  barValueLabel: {
    color: '#0a0f13',
    fontWeight: '800',
    alignSelf: 'flex-end',
    paddingRight: 8,
    zIndex: 1,
  },
  matchesTableContainer: {
    marginTop: 14,
    backgroundColor: 'rgba(2, 10, 23, 0.95)',
    borderRadius: 20,
    overflow: 'hidden',
    paddingTop: 8,
  },
  tableHeaderRow: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderLabel: { width: 130 },
  tableHeaderCell: {
    width: 64,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 34 * 0.4,
  },
  tableRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tableMatchRow: { backgroundColor: '#722124' },
  jornadaRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  jornadaText: {
    color: '#f2e84f',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  tableLabel: { width: 130, color: '#fff', fontWeight: '800', fontSize: 34 * 0.45 },
  tableLabelMatch: { lineHeight: 28 * 0.75 },
  tableCellValue: { width: 64, color: '#fff', textAlign: 'center', fontWeight: '700' },
});