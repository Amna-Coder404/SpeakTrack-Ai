import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import LineChart from '../../components/LineChart';
import { colors } from '../../lib/theme';
import { dayLabel, totalLabel } from '../../lib/format';
import { s } from '../../styles/progress.style';

const DAY = 24 * 60 * 60 * 1000;

// Trend chip for one mistake category: compares the first week with this week.
const trendOf = (m, isNewUser) => {
    if (isNewUser) return { text: 'New', color: colors.muted, bg: colors.cream };
    const diff = m.recent - m.first;
    if (diff < 0) return { text: `▼ ${Math.abs(diff)} fewer`, color: colors.green, bg: colors.greenSoft };
    if (diff > 0) return { text: `▲ ${diff} more`, color: colors.error, bg: '#FBE9E5' };
    return { text: 'Same', color: colors.muted, bg: colors.cream };
};

export default function Progress() {
    const { width } = useWindowDimensions();
    const [days, setDays] = useState(14);
    const o = useQuery(api.sessions.overview, { days });

    const chartWidth = width - 36; // screen padding only, no card

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

    // Before the first week is over, "first week" and "this week" are the same data.
    const isNewUser = !o.first || Date.now() - o.first.at < 7 * DAY;

    return (
        <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <Text style={s.title}>Your progress</Text>

            {/* First vs latest */}
            <View style={s.compare}>
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

            {/* Totals */}
            <View style={s.statsRow}>
                <View style={s.stat}>
                    <Text style={s.statValue}>{o.count}</Text>
                    <Text style={s.statLabel}>Sessions</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.stat}>
                    <Text style={s.statValue}>{totalLabel(o.totalSec)}</Text>
                    <Text style={s.statLabel}>Speaking</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.stat}>
                    <Text style={s.statValue}>{o.newWords}</Text>
                    <Text style={s.statLabel}>New words</Text>
                </View>
            </View>

            {/* Chart */}
            <View style={s.section}>
                <View style={s.rowBetween}>
                    <Text style={s.sectionTitle}>Speaking score</Text>
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

            {/* Common mistakes */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>Common mistakes</Text>
                <Text style={s.sectionHint}>
                    {isNewUser
                        ? 'Mistakes found in your sessions. Trends appear after your first week.'
                        : 'Compared with your first week.'}
                </Text>

                {o.mistakes.length === 0 ? (
                    <Text style={s.empty}>Mistakes the AI finds in your sessions will be counted here.</Text>
                ) : (
                    o.mistakes.map((m, i) => {
                        const trend = trendOf(m, isNewUser);
                        return (
                            <View key={m.category} style={[s.mistakeRow, i === 0 && { borderTopWidth: 0 }]}>
                                <Text style={s.rank}>{i + 1}</Text>

                                <View style={{ flex: 1 }}>
                                    <Text style={s.mistakeName}>{m.category}</Text>
                                    <Text style={s.mistakeNums}>
                                        {isNewUser
                                            ? `${m.recent} found`
                                            : `${m.first} in first week · ${m.recent} this week`}
                                    </Text>
                                </View>

                                <View style={[s.chip, { backgroundColor: trend.bg }]}>
                                    <Text style={[s.chipText, { color: trend.color }]}>{trend.text}</Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}