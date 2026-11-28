import { useCallback, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth, useUser } from '@clerk/expo';
import { useMutation, useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

import { api } from '../../../convex/_generated/api';
import { colors } from '../../lib/theme';
import { fullDate } from '../../lib/format';
import { s } from '../../styles/profile.style';

const LEVELS = ['Beginner (A2)', 'Intermediate (B1)', 'Upper-intermediate (B2)', 'Advanced (C1)'];
const LENGTHS = [5, 10, 15, 20, 25, 30];

const next = (list, current) => list[(list.indexOf(current) + 1) % list.length];

export default function Profile() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const me = useQuery(api.users.me);
    const updateSettings = useMutation(api.users.updateSettings);
    const [micAllowed, setMicAllowed] = useState(null);

    // This checks mic permission
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
    const minutes = me?.sessionMinutes || 10;

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
                <Row label="Session length" value={`${minutes} minutes`} onPress={() => save({ sessionMinutes: next(LENGTHS, minutes) })} />
            </View>
            <Text style={s.hint}>Tap Level or Session length to change them.</Text>

            <View style={s.card}>
                <Row
                    label="Microphone access"
                    value={micAllowed === null ? '' : micAllowed ? 'Allowed' : 'Not allowed'}
                    chevron
                    onPress={() => Linking.openSettings()}
                />

            </View>

            <Pressable style={({ pressed }) => [s.signOut, pressed && { opacity: 0.8 }]} onPress={handleSignOut}>
                <Text style={s.signOutText}>Sign out</Text>
            </Pressable>
        </ScrollView>
    );
}