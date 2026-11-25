import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../lib/theme';

export default function ScoreRing({ value = 0, size = 124, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / 100));
  const mid = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={mid} cy={mid} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={mid}
          cy={mid}
          r={r}
          stroke={colors.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c * pct} ${c}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${mid}, ${mid}`}
        />
      </Svg>
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: colors.text }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: -2 }}>/ 100</Text>
    </View >
  );
}
