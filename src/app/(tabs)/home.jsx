import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import Orb from '../../components/Orb';
import LineChart from '../../components/LineChart';
import { colors, fonts } from '../../lib/theme';
import { greeting, longDate, minutesLabel, totalLabel, whenLabel } from '../../lib/format';
import { todaysTopic } from '../../lib/topics';

export default function Home() {
    const { user } = useUser();
    const overview = useQuery(api.sessions.overview, { days: 14 });
    const recent = useQuery(api.sessions.listRecent, { limit: 3 });

    const topic = todaysTopic();
    const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'there';

    const startSpeaking = () => router.push({ pathname: '/speaking', params: { topic } });

    const hasSessions = (overview?.count ?? 0) > 0;
    const sparkline =
        overview && overview.series.length > 1
            ? overview.series.map((p, i) => ({ x: i / (overview.series.length - 1), y: p.score }))
            : [];

    return (
        <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <View style={s.header}>
                <View style={{ flex: 1 }}>
                    <Text style={s.date}>{longDate()}</Text>
                    <Text style={s.hello}>
                        {greeting()}, {firstName}
                    </Text>
                </View>
                {user?.imageUrl ? (
                    <Image source={{ uri: user.imageUrl }} style={s.avatar} />
                ) : (
                    <View style={[s.avatar, s.avatarFallback]}>
                        <Text style={s.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
            </View>

            {/* Today's topic */}
            <View style={s.topicCard}>
                <Orb size={88} glow={false} />
                <View style={s.topicBody}>
                    <Text style={s.topicLabel}>TODAY'S TOPIC</Text>
                    <Text style={s.topicTitle}>{topic}</Text>
                    <Pressable style={({ pressed }) => [s.startBtn, pressed && { opacity: 0.85 }]} onPress={startSpeaking}>
                        <View style={s.startDot} />
                        <Text style={s.startText}>Start speaking</Text>
                    </Pressable>
                </View>
            </View>

            {/* Improvement */}
            <View style={s.card}>
                <View style={s.rowBetween}>
                    <Text style={s.cardLabel}>Your improvement</Text>
                    {hasSessions && overview.count > 1 && (
                        <View style={s.pill}>
                            <Text style={s.pillText}>
                                ▲ {overview.delta >= 0 ? '+' : ''}
                                {overview.delta} pts
                            </Text>
                        </View>
                    )}
                </View>

                {overview === undefined || overview === null ? (
                    <ActivityIndicator color={colors.accent} style={{ marginVertical: 18 }} />
                ) : hasSessions ? (
                    <View style={s.improveRow}>
                        <View>
                            <Text style={s.tiny}>First session</Text>
                            <Text style={[s.bigNumber, { color: colors.muted }]}>{overview.first.score}</Text>
                        </View>
                        <Text style={s.arrow}>→</Text>
                        <View>
                            <Text style={s.tiny}>Latest</Text>
                            <Text style={s.bigNumber}>{overview.latest.score}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <LineChart data={sparkline} width={96} height={44} />
                        </View>
                    </View>
                ) : (
                    <Text style={s.empty}>Finish your first session and your score will appear here.</Text>
                )}
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
                <View style={[s.card, s.stat]}>
                    <Text style={s.statValue}>{overview?.count ?? 0}</Text>
                    <Text style={s.statLabel}>Sessions completed</Text>
                </View>
                <View style={[s.card, s.stat]}>
                    <Text style={s.statValue}>{totalLabel(overview?.totalSec ?? 0)}</Text>
                    <Text style={s.statLabel}>Total speaking time</Text>
                </View>
            </View>

            {/* Recent sessions */}
            <View style={[s.rowBetween, { marginTop: 22, marginBottom: 10 }]}>
                <Text style={s.sectionTitle}>Recent sessions</Text>
                <Pressable onPress={() => router.push('/progress')}>
                    <Text style={s.seeAll}>See all</Text>
                </Pressable>
            </View>

            {recent && recent.length > 0 ? (
                recent.map((item) => (
                    <Pressable
                        key={item._id}
                        style={({ pressed }) => [s.card, s.sessionRow, pressed && { opacity: 0.85 }]}
                        onPress={() => router.push(`/result/${item._id}`)}
                    >
                        <View style={s.scoreBox}>
                            <Text style={s.scoreText}>{item.score}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.sessionTopic} numberOfLines={1}>
                                {item.topic}
                            </Text>
                            <Text style={s.sessionMeta}>
                                {whenLabel(item.startedAt)} · {minutesLabel(item.durationSec)}
                            </Text>
                        </View>
                        {item.delta !== null && (
                            <Text style={[s.delta, item.delta < 0 && { color: colors.danger }]}>
                                {item.delta >= 0 ? '+' : ''}
                                {item.delta}
                            </Text>
                        )}
                    </Pressable>
                ))
            ) : (
                <View style={[s.card, { alignItems: 'center', paddingVertical: 22 }]}>
                    <Text style={s.empty}>No sessions yet. Tap "Start speaking" to begin.</Text>
                </View>
            )}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 30 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    date: { color: colors.muted, fontSize: 12.5 },
    hello: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 2 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    avatarFallback: { backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: colors.onDark, fontWeight: '700', fontSize: 15 },

    topicCard: {
        backgroundColor: colors.dark,
        borderRadius: 22,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
        marginBottom: 12,
    },
    topicBody: { flex: 1 },
    topicLabel: { color: colors.mutedOnDark, fontSize: 11, letterSpacing: 0.8 },
    topicTitle: { fontFamily: fonts.serif, color: colors.onDark, fontSize: 25, lineHeight: 27, marginTop: 6 },
    startBtn: {
        alignSelf: 'flex-start',
        marginTop: 12,
        backgroundColor: colors.accent,
        borderRadius: 20,
        paddingVertical: 9,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    startDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFD2C2' },
    startText: { color: '#ff0000', fontWeight: '700', fontSize: 13 },

    card: {
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
    },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
    pill: { backgroundColor: colors.greenSoft, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 9 },
    pillText: { color: colors.green, fontSize: 11.5, fontWeight: '700' },
    improveRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 14 },
    tiny: { color: colors.muted, fontSize: 11.5 },
    bigNumber: { color: colors.text, fontSize: 38, fontWeight: '800', lineHeight: 44 },
    arrow: { color: colors.muted, fontSize: 18, marginBottom: 10 },
    empty: { color: colors.muted, fontSize: 13.5, lineHeight: 20, marginTop: 10 },

    statsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    stat: { flex: 1 },
    statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
    statLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },

    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
    seeAll: { color: colors.accent, fontSize: 13, fontWeight: '700' },
    sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, padding: 12 },
    scoreBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: colors.cream,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: { color: colors.text, fontWeight: '800', fontSize: 15 },
    sessionTopic: { color: colors.text, fontWeight: '700', fontSize: 14.5 },
    sessionMeta: { color: colors.muted, fontSize: 12, marginTop: 3 },
    delta: { color: colors.green, fontWeight: '800', fontSize: 14 },
});