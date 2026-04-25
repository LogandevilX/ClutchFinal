import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const zonas = [
  { key: 'Cabecera', top: '8%', left: '44%' },
  { key: 'TripleEsquinaDer', top: '18%', left: '76%' },
  { key: 'TripleEsquinaIz', top: '18%', left: '8%' },
  { key: 'EsquinaIz', top: '35%', left: '13%' },
  { key: 'EsquinaDer', top: '35%', left: '72%' },
  { key: 'TripleCabecera', top: '22%', left: '44%' },
  { key: '45Der', top: '30%', left: '59%' },
  { key: '45Iz', top: '30%', left: '30%' },
  { key: 'Pintura', top: '44%', left: '44%' },
];

export default function MapaCampo({ disabled = false, onZonePress }) {
  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 800 800" fill="none">
        <Path
          fill="#F40000"
          d="M778.249 140.652c-13.391-13.399-32.043-21.752-52.513-21.738H74.258c-20.463-.012-39.108 8.339-52.514 21.738C8.322 154.061-.02 172.706 0 193.177v413.632a73.91 73.91 0 0 0 21.744 52.5c13.406 13.424 32.05 21.777 52.514 21.777h651.476c20.472 0 39.122-8.353 52.513-21.777a73.913 73.913 0 0 0 21.751-52.5V193.177c.021-20.471-8.326-39.116-21.749-52.525Z"
        />
      </Svg>

      {zonas.map((zona) => (
        <Pressable
          key={zona.key}
          style={[styles.zone, { top: zona.top, left: zona.left }, disabled ? styles.zoneDisabled : null]}
          disabled={disabled}
          onPress={() => onZonePress?.(zona.key)}
        >
          <Text style={styles.zoneText}>{zona.key}</Text>
        </Pressable>
      ))}

      {disabled ? <View style={styles.disabledOverlay}><Text style={styles.disabledText}>Selecciona un jugador</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#761313',
  },
  zone: {
    position: 'absolute',
    backgroundColor: '#00000088',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  zoneDisabled: {
    opacity: 0.45,
  },
  zoneText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
});
