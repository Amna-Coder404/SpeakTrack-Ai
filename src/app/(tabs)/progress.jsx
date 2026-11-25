import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Pressable } from 'react-native';
import { useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import LineChart from '../../components/LineChart';
import { colors } from '../../lib/theme';
import { dayLabel, totalLabel } from '../../lib/format';

const DAY = 24 * 60 * 60 * 1000;

export default function Progress() {
    const { width } = useWindowDimensions();
    const [days, setDays] = useState(14);
    const o = useQuery(api.sessions.overview, { days });

    const chartWidth = width - 36 - 32; // screen padding + card padding

    if (o === undefined || o === null) {
        return (
            <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }

    const since = Date.now() - days * DAY;
    const data = o.series.map((p) => ({
        x: Math.max(0, Math.min(1, (p.at - since) / (days * DAY))),
        y: p.score,
    }));
    const scores = o.series.map((p) => p.score);
    const lo = scores.length ? Math.max(0, Math.min(...scores) - 10) : 0;
    const hi = scores.length ? Math.min(100, Math.max(...scores) + 10) : 100;
    const labels = [0, 1, 2, 3, 4].map((i) => `Day ${Math.round(1 + (i * (days - 1)) / 4)}`);

    const maxMistake = Math.max(1, ...o.mistakes.flatMap((m) => [m.first, m.recent]));

    return (
        <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <Text style={s.title}>Your progress</Text>

            {/* First vs latest */}
            <View style={[s.card, s.compare]}>
                <View>
                    <Text style={s.tiny}>First session</Text>
                    <Text style={s.score}>
                        <Text style={[s.scoreBig, { color: colors.muted }]}>{o.first ? o.first.score : '–'}</Text>
                        <Text style={s.outOf}>/100</Text>
                    </Text>
                    <Text style={s.tiny}>{o.first ? dayLabel(o.first.at) : 'Not yet'}</Text>
                </View>

                {o.count > 1 && (
                    <View style={s.gain}>
                        <Text style={s.gainBig}>
                            {o.delta >= 0 ? '+' : ''}
                            {o.delta}
                        </Text>
                        <Text style={s.gainSmall}>points</Text>
                    </View>
                )}

                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.tiny}>Latest session</Text>
                    <Text style={s.score}>
                        <Text style={s.scoreBig}>{o.latest ? o.latest.score : '–'}</Text>
                        <Text style={s.outOf}>/100</Text>
                    </Text>
                    <Text style={s.tiny}>{o.latest ? dayLabel(o.latest.at) : 'Not yet'}</Text>
                </View>
            </View>

            {/* Chart */}
            <View style={[s.card, { marginTop: 12 }]}>
                <View style={s.rowBetween}>
                    <Text style={s.cardLabel}>Speaking score</Text>
                    <View style={s.toggle}>
                        {[
                            { label: '2 weeks', value: 14 },
                            { label: 'Monthly', value: 30 },
                        ].map((opt) => (
                            <Pressable
                                key={opt.value}
                                onPress={() => setDays(opt.value)}
                                style={[s.toggleBtn, days === opt.value && s.toggleOn]}
                            >
                                <Text style={[s.toggleText, days === opt.value && { color: colors.text }]}>{opt.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {data.length === 0 ? (
                    <Text style={s.empty}>No sessions in this period yet. Complete a session to see your line.</Text>
                ) : (
                    <View style={{ marginTop: 12 }}>
                        <LineChart data={data} width={chartWidth} height={130} min={lo} max={hi} area grid hollowFirst />
                        <View style={s.labelsRow}>
                            {labels.map((l) => (
                                <Text key={l} style={s.axisLabel}>
                                    {l}
                                </Text>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            {/* Totals */}
            <View style={s.statsRow}>
                <View style={[s.card, s.stat]}>
                    <Text style={s.statValue}>{o.count}</Text>
                    <Text style={s.statLabel}>Sessions</Text>
                </View>
                <View style={[s.card, s.stat]}>
                    <Text style={s.statValue}>{totalLabel(o.totalSec)}</Text>
                    <Text style={s.statLabel}>Speaking</Text>
                </View>
                <View style={[s.card, s.stat]}>
                    <Text style={s.statValue}>{o.newWords}</Text>
                    <Text style={s.statLabel}>New words</Text>
                </View>
            </View>

            {/* Common mistakes */}
            <View style={[s.card, { marginTop: 12 }]}>
                <View style={s.rowBetween}>
                    <Text style={s.cardLabel}>Common mistakes</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={s.legend}>
                            <View style={[s.legendDot, { backgroundColor: '#D9D3C7' }]} />
                            <Text style={s.legendText}>First week</Text>
                        </View>
                        <View style={s.legend}>
                            <View style={[s.legendDot, { backgroundColor: colors.accent }]} />
                            <Text style={s.legendText}>This week</Text>
                        </View>
                    </View>
                </View>

                {o.mistakes.length === 0 ? (
                    <Text style={s.empty}>Mistakes the AI finds in your sessions will be counted here.</Text>
                ) : (
                    o.mistakes.map((m) => (
                        <View key={m.category} style={{ marginTop: 16 }}>
                            <View style={s.rowBetween}>
                                <Text style={s.mistakeName}>{m.category}</Text>
                                <Text style={s.mistakeNums}>
                                    {m.first} → <Text style={{ color: colors.text, fontWeight: '800' }}>{m.recent}</Text>
                                </Text>
                            </View>
                            <View style={s.barTrack}>
                                <View style={[s.barFill, { width: `${(m.first / maxMistake) * 100}%`, backgroundColor: '#D9D3C7' }]} />
                            </View>
                            <View style={[s.barTrack, { marginTop: 4 }]}>
                                <View style={[s.barFill, { width: `${(m.recent / maxMistake) * 100}%`, backgroundColor: colors.accent }]} />
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 30 },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 16 },
    card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    tiny: { color: colors.muted, fontSize: 11.5 },
    compare: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    score: { marginVertical: 2 },
    scoreBig: { color: colors.text, fontSize: 38, fontWeight: '800' },
    outOf: { color: colors.muted, fontSize: 13 },
    gain: { backgroundColor: colors.greenSoft, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
    gainBig: { color: colors.green, fontSize: 20, fontWeight: '800' },
    gainSmall: { color: colors.green, fontSize: 11, fontWeight: '600' },
    toggle: { flexDirection: 'row', backgroundColor: colors.cream, borderRadius: 10, padding: 3 },
    toggleBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
    toggleOn: { backgroundColor: colors.card },
    toggleText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
    labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    axisLabel: { color: colors.muted, fontSize: 10.5 },
    empty: { color: colors.muted, fontSize: 13.5, lineHeight: 20, marginTop: 12 },
    statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    stat: { flex: 1, padding: 14 },
    statValue: { color: colors.text, fontSize: 21, fontWeight: '800' },
    statLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
    legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 2 },
    legendText: { color: colors.muted, fontSize: 10.5 },
    mistakeName: { color: colors.text, fontSize: 14, fontWeight: '700' },
    mistakeNums: { color: colors.muted, fontSize: 13 },
    barTrack: { height: 5, borderRadius: 3, backgroundColor: colors.cream, marginTop: 8, overflow: 'hidden' },
    barFill: { height: 5, borderRadius: 3 },
});