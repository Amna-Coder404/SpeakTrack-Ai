import { useCallback, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth, useUser } from '@clerk/expo';
import { useMutation, useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import { api } from '../../../convex/_generated/api';
import { colors } from '../../lib/theme';
import { fullDate } from '../../lib/format';

const LEVELS = ['Beginner (A2)', 'Intermediate (B1)', 'Upper-intermediate (B2)', 'Advanced (C1)'];
const VOICES = [
    { id: 'en-US', label: 'Warm · American' },
    { id: 'en-GB', label: 'Warm · British' },
];
const LENGTHS = [5, 10, 15];

const next = (list, current) => list[(list.indexOf(current) + 1) % list.length];

export default function Profile() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const me = useQuery(api.users.me);
    const updateSettings = useMutation(api.users.updateSettings);
    const [micAllowed, setMicAllowed] = useState(null);

    // THis check mic permission 
    useFocusEffect(
        useCallback(() => {
            ExpoSpeechRecognitionModule.getPermissionsAsync()
                .then((r) => setMicAllowed(r.granted))
                .catch(() => setMicAllowed(null));
        }, [])
    );

    const name = user?.fullName || me?.name || 'Learner';
    const email = me?.email || '';
    const level = me?.level || 'Intermediate (B1)';
    const voice = VOICES.find((v) => v.id === (me?.voice || 'en-US')) || VOICES[0];
    const minutes = me?.sessionMinutes || 10;
    const saveTranscripts = me?.saveTranscripts !== false;

    const save = (patch) =>
        updateSettings(patch).catch((e) => Alert.alert('Could not save', e?.message || 'Please try again.'));

    const handleSignOut = async () => {
        try {
            await signOut();
            router.replace('/welcome');
        } catch (e) {
            Alert.alert('Sign out failed', e?.message || 'Please try again.');
        }
    };

    const Row = ({ label, value, onPress, chevron }) => (
        <Pressable onPress={onPress} disabled={!onPress} style={s.row}>
            <Text style={s.rowLabel}>{label}</Text>
            <View style={s.rowRight}>
                {!!value && <Text style={s.rowValue}>{value}</Text>}
                {chevron && <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
            </View>
        </Pressable>
    );

    return (
        <ScrollView style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            <Text style={s.title}>Profile</Text>

            <View style={[s.card, s.userCard]}>
                {user?.imageUrl ? (
                    <Image source={{ uri: user.imageUrl }} style={s.avatar} />
                ) : (
                    <View style={[s.avatar, { backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ color: colors.onDark, fontSize: 22, fontWeight: '700' }}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={s.name}>{name}</Text>
                    <View style={s.emailRow}>
                        <View style={s.gBadge}>
                            <Text style={s.gText}>G</Text>
                        </View>
                        <Text style={s.email} numberOfLines={1}>
                            {email}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={[s.card, { marginTop: 12 }]}>
                <Row label="Member since" value={me ? fullDate(me.createdAt) : ''} />
                <Row label="Level" value={level} onPress={() => save({ level: next(LEVELS, level) })} />
                <Row label="AI partner voice" value={voice.label} onPress={() => save({ voice: next(VOICES.map((v) => v.id), voice.id) })} />
                <Row label="Session length" value={`${minutes} minutes`} onPress={() => save({ sessionMinutes: next(LENGTHS, minutes) })} />
            </View>
            <Text style={s.hint}>Tap Level, Voice or Session length to change them.</Text>

            <View style={s.card}>
                <Row
                    label="Microphone access"
                    value={micAllowed === null ? '' : micAllowed ? 'Allowed' : 'Not allowed'}
                    chevron
                    onPress={() => Linking.openSettings()}
                />
                <Row
                    label="Save transcripts"
                    value={saveTranscripts ? 'On' : 'Off'}
                    chevron
                    onPress={() => save({ saveTranscripts: !saveTranscripts })}
                />

            </View>

            <Pressable style={({ pressed }) => [s.signOut, pressed && { opacity: 0.8 }]} onPress={handleSignOut}>
                <Text style={s.signOutText}>Sign out</Text>
            </Pressable>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.cream },
    content: { paddingHorizontal: 18, paddingTop: 58, paddingBottom: 30 },
    title: { color: colors.text, fontSize: 26, fontWeight: '800', marginBottom: 16 },
    card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
    userCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
    avatar: { width: 54, height: 54, borderRadius: 27 },
    name: { color: colors.text, fontSize: 17, fontWeight: '800' },
    emailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    email: { color: colors.muted, fontSize: 12.5, flexShrink: 1 },
    gBadge: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DADCE0', alignItems: 'center', justifyContent: 'center' },
    gText: { color: '#4285F4', fontWeight: '800', fontSize: 9 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowLabel: { color: colors.text, fontSize: 14.5, fontWeight: '600' },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    rowValue: { color: colors.muted, fontSize: 13.5 },
    hint: { color: colors.muted, fontSize: 11.5, marginTop: 6, marginBottom: 12, marginLeft: 4 },
    signOut: { marginTop: 14, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingVertical: 16, alignItems: 'center' },
    signOutText: { color: colors.danger, fontWeight: '800', fontSize: 15 },
});