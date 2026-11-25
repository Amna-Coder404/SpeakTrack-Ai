import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../../../convex/_generated/api';
import ScoreRing from '../../components/ScoreRing';
import { colors, fonts } from '../../lib/theme';
import { dayLabel, minutesLabel } from '../../lib/format';

function Feedback({ text, focus }) {
    if (focus) {
        const i = text.toLowerCase().indexOf(focus.toLowerCase());
        if (i >= 0) {
            return (
                <Text style={s.feedback}>
                    {text.slice(0, i)}
                    <Text style={s.focus}>{text.slice(i, i + focus.length)}</Text>
                    {text.slice(i + focus.length)}
                </Text>
            );
        }
    }
    return <Text style={s.feedback}>{text}</Text>;
}

export default function SessionResult() {
    const { id } = useLocalSearchParams();
    const data = useQuery(api.sessions.get, { sessionId: id });

    const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

    if (data === undefined) {
        return (
            <View style={[s.screen, { alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator color={colors.accent} />
            </View>
        );
    }
    if (data === null) {
        return (
            <View style={[s.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
                <Text style={s.feedback}>This session could not be found.</Text>
                <Pressable onPress={goBack} style={{ marginTop: 14 }}>
                    <Text style={s.focus}>Go back</Text>
                </Pressable>
            </View>
        );
    }

    const { session, corrections, delta } = data;
    const skills = [
        { label: 'Grammar', score: session.grammarScore, note: session.notes?.grammar },
        { label: 'Vocabulary', score: session.vocabularyScore, note: session.notes?.vocabulary },
        { label: 'Fluency', score: session.fluencyScore, note: session.notes?.fluency },
        { label: 'Sentence formation', score: session.sentenceScore, note: session.notes?.sentence },
        { label: 'Pronunciation', score: session.pronunciationScore, note: session.notes?.pronunciation },
    ];

    return (
        <View style={s.screen}>
            <StatusBar style="dark" />
            <View style={s.topBar}>
                <Pressable style={s.backBtn} onPress={goBack}>
                    <Ionicons name="chevron-back" size={20} color={colors.text} />
                </Pressable>
                <Text style={s.topTitle}>Session result</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                <View style={s.hero}>
                    <ScoreRing value={session.overallScore ?? 0} />
                    <View style={{ flex: 1 }}>
                        {delta !== null && (
                            <View style={[s.pill, delta < 0 && { backgroundColor: '#F8DDD9' }]}>
                                <Text style={[s.pillText, delta < 0 && { color: colors.danger }]}>
                                    {delta >= 0 ? '▲ +' : '▼ '}
                                    {delta} vs last session
                                </Text>
                            </View>
                        )}
                        <Text style={s.topic}>{session.topic}</Text>
                        <Text style={s.meta}>
                            {dayLabel(session.startedAt)} · {minutesLabel(session.durationSec ?? 0)} · {session.turnCount} turns
                        </Text>
                    </View>
                </View>

                <View style={s.card}>
                    <Text style={s.cardLabel}>Overall feedback</Text>
                    <Feedback text={session.feedback || ''} focus={session.focusArea} />
                </View>

                <View style={[s.card, { marginTop: 12 }]}>
                    {skills.map((k, i) => (
                        <View key={k.label} style={[s.skill, i > 0 && s.skillDivider]}>
                            <View style={s.skillTop}>
                                <Text style={s.skillName}>{k.label}</Text>
                                <Text style={s.skillScore}>{k.score ?? 0}</Text>
                            </View>
                            <View style={s.track}>
                                <View style={[s.fill, { width: `${k.score ?? 0}%` }]} />
                            </View>
                            {!!k.note && <Text style={s.note}>{k.note}</Text>}
                        </View>
                    ))}
                </View>

                {corrections.length > 0 && (
                    <View style={[s.card, { marginTop: 12 }]}>
                        <Text style={s.cardLabel}>What to fix</Text>
                        {corrections.map((c) => (
                            <View key={c._id} style={s.correction}>
                                <Text style={s.original}>{c.original}</Text>
                                <Text style={s.corrected}>{c.corrected}</Text>
                                <Text style={s.note}>
                                    {c.category}
                                    {c.explanation ? ` · ${c.explanation}` : ''}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {(session.newWords?.length ?? 0) > 0 && (
                    <View style={[s.card, { marginTop: 12 }]}>
                        <Text style={s.cardLabel}>New words to remember</Text>
                        <View style={s.chips}>
                            {session.newWords.map((w) => (
                                <View key={w} style={s.chip}>
                                    <Text style={s.chipText}>{w}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 52, paddingBottom: 8 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    topTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
    content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 40 },
    hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    pill: { alignSelf: 'flex-start', backgroundColor: colors.greenSoft, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 9 },
    pillText: { color: colors.green, fontSize: 11.5, fontWeight: '700' },
    topic: { fontFamily: fonts.serif, color: colors.text, fontSize: 28, lineHeight: 30, marginTop: 8 },
    meta: { color: colors.muted, fontSize: 12, marginTop: 6 },
    card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 16 },
    cardLabel: { color: colors.muted, fontSize: 12.5, fontWeight: '600', marginBottom: 8 },
    feedback: { color: colors.text, fontSize: 15, lineHeight: 23 },
    focus: { color: colors.accent, fontWeight: '800' },
    skill: { paddingVertical: 12 },
    skillDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    skillTop: { flexDirection: 'row', justifyContent: 'space-between' },
    skillName: { color: colors.text, fontWeight: '700', fontSize: 14 },
    skillScore: { color: colors.text, fontWeight: '800', fontSize: 14 },
    track: { height: 5, borderRadius: 3, backgroundColor: colors.cream, marginTop: 8, overflow: 'hidden' },
    fill: { height: 5, borderRadius: 3, backgroundColor: colors.text },
    note: { color: colors.muted, fontSize: 12, marginTop: 6 },
    correction: { marginTop: 14 },
    original: { color: colors.muted, fontSize: 14.5, textDecorationLine: 'line-through' },
    corrected: { color: colors.green, fontSize: 15, fontWeight: '700', marginTop: 3 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: { backgroundColor: colors.accentSoft, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 12 },
    chipText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
});