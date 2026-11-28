import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useSSO } from '@clerk/expo';

import Orb from '../../components/Orb';
import { colors, fonts } from '../../lib/theme';
import { s } from '../../styles/auth.style';

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
                <View style={{ height: 19 }} />

                <Text style={s.terms}>By continuing you agree to the Terms & Privacy Policy</Text>
            </View>
        </View>
    );
}

