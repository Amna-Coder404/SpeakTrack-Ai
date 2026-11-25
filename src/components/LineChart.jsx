import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../lib/theme';

// data: [{ x: 0..1, y: number }] sorted by x
export default function LineChart({
  data,
  width,
  height,
  min,
  max,
  area = false,
  grid = false,
  strokeWidth = 2,
  hollowFirst = false,
}) {
  if (!data || data.length === 0) return <View style={{ width, height }} />;

  const pad = 6;
  const ys = data.map((d) => d.y);
  const lo = min ?? Math.min(...ys) - 4;
  const hi = max ?? Math.max(...ys) + 4;
  const span = Math.max(1, hi - lo);

  const pts = data.map((d) => ({
    x: pad + d.x * (width - pad * 2),
    y: pad + (1 - (d.y - lo) / span) * (height - pad * 2),
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const first = pts[0];
  const areaPath = `${line} L${last.x.toFixed(1)},${height} L${first.x.toFixed(1)},${height} Z`;

  return (
    <Svg width={width} height={height}>
      {grid &&
        [0.2, 0.5, 0.8].map((f) => (
          <Line
            key={f}
            x1={0}
            x2={width}
            y1={height * f}
            y2={height * f}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ))}
      {area && pts.length > 1 && <Path d={areaPath} fill="rgba(232,102,61,0.10)" />}
      {pts.length > 1 && (
        <Path d={line} stroke={colors.accent} strokeWidth={strokeWidth} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      )}
      {hollowFirst && pts.length > 1 && (
        <Circle cx={first.x} cy={first.y} r={3.5} fill={colors.card} stroke={colors.muted} strokeWidth={1.5} />
      )}
      <Circle cx={last.x} cy={last.y} r={4} fill={colors.accent} />
    </Svg>
  );
}
