import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useSSO } from '@clerk/expo';

import Orb from '../../components/Orb';
import { colors, fonts } from '../../lib/theme';

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
    useEffect(() => {
        if (Platform.OS !== 'android') return undefined;
        WebBrowser.warmUpAsync();
        return () => {
            WebBrowser.coolDownAsync();
        };
    }, []);
}

export default function WelcomeScreen() {
    useWarmUpBrowser();

    const { startSSOFlow } = useSSO();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const signInWithGoogle = useCallback(async () => {
        try {
            setError('');
            setLoading(true);

            const result = await startSSOFlow({
                strategy: 'oauth_google',
                redirectUrl: Linking.createURL('/'),
            });
            console.log('SSO result:', {
                createdSessionId: result.createdSessionId,
                authSession: result.authSessionResult?.type,
            });

            const { createdSessionId, setActive } = result;
            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
                router.replace('/home');
            } else {
                setError('Sign in was not completed. Please try again.');
            }
        } catch (err) {
            console.error('Google sign in failed:', JSON.stringify(err, null, 2));
            setError(err?.errors?.[0]?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [startSSOFlow]);

    return (
        <View style={s.container}>
            <StatusBar style="light" />

            <View style={s.brandRow}>
                <View style={s.bars}>
                    <View style={[s.bar, { height: 9 }]} />
                    <View style={[s.bar, { height: 17 }]} />
                    <View style={[s.bar, { height: 12 }]} />
                </View>
                <Text style={s.brand}>SpeakTrack</Text>
            </View>

            <View style={s.orbWrap}>
                <Orb size={165} pulse />
            </View>

            <View>
                <Text style={s.headline}>Speak.</Text>
                <Text style={s.headline}>Track.</Text>
                <Text style={[s.headline, s.headlineAccent]}>Improve.</Text>
                <Text style={s.sub}>
                    Have real conversations with an AI partner, then see exactly how your English is changing.
                </Text>

                {!!error && <Text style={s.error}>{error}</Text>}

                <Pressable
                    style={({ pressed }) => [s.primary, pressed && s.pressed, loading && s.disabled]}
                    onPress={signInWithGoogle}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.dark} />
                    ) : (
                        <>
                            <View style={s.gBadge}>
                                <Text style={s.gText}>G</Text>
                            </View>
                            <Text style={s.primaryText}>Continue with Google</Text>
                        </>
                    )}
                </Pressable>

                <Pressable
                    style={({ pressed }) => [s.secondary, pressed && s.pressed, loading && s.disabled]}
                    onPress={signInWithGoogle}
                    disabled={loading}
                >
                    <Text style={s.secondaryText}>I already have an account</Text>
                </Pressable>

                <Text style={s.terms}>By continuing you agree to the Terms & Privacy Policy</Text>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.dark,
        paddingHorizontal: 24,
        paddingTop: 64,
        paddingBottom: 34,
        justifyContent: 'space-between',
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bars: { flexDirection: 'row', alignItems: 'center', gap: 2.5 },
    bar: { width: 3.5, borderRadius: 2, backgroundColor: colors.accent },
    brand: { color: colors.onDark, fontSize: 18, fontWeight: '700' },
    orbWrap: { alignItems: 'center', marginTop: 10 },
    headline: {
        fontFamily: fonts.serif,
        fontSize: 54,
        lineHeight: 54,
        color: colors.onDark,
    },
    headlineAccent: { fontFamily: fonts.serifItalic, color: colors.accent },
    sub: {
        color: colors.mutedOnDark,
        fontSize: 15,
        lineHeight: 22,
        marginTop: 14,
        marginBottom: 22,
        maxWidth: 300,
    },
    error: { color: '#FF8E7A', fontSize: 13, marginBottom: 12 },
    primary: {
        backgroundColor: colors.onDark,
        borderRadius: 16,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    gBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DADCE0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gText: { color: '#4285F4', fontWeight: '800', fontSize: 14 },
    primaryText: { color: colors.dark, fontSize: 16, fontWeight: '700' },
    secondary: {
        marginTop: 10,
        height: 54,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.darkBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: { color: colors.onDark, fontSize: 15, fontWeight: '600' },
    terms: { color: colors.mutedOnDark, fontSize: 11.5, textAlign: 'center', marginTop: 16 },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.6 },
})