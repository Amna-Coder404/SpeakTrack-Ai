import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useSSO } from '@clerk/expo';

WebBrowser.maybeCompleteAuthSession();

const COLORS = {
    primary: '#6845D9',
    background: '#FAF9FF',
    surface: '#FFFFFF',
    text: '#19172B',
    secondary: '#77738A',
    border: '#ECE9F5',
    lightPurple: '#F0ECFF',
    danger: '#D94848',
};

// Speeds up the browser opening on Android.
function useWarmUpBrowser() {
    useEffect(() => {
        if (Platform.OS !== 'android') return;
        WebBrowser.warmUpAsync();
        return () => {
            WebBrowser.coolDownAsync();
        };
    }, []);
}

export default function WelcomeScreen() {
    useWarmUpBrowser();

    const { startSSOFlow } = useSSO();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleSignIn = useCallback(async () => {
        try {
            setError('');
            setIsLoading(true);

            const redirectUrl = Linking.createURL('/');
            console.log('Redirect URL:', redirectUrl);

            const result = await startSSOFlow({
                strategy: 'oauth_google',
                redirectUrl,
            });

            console.log('SSO result:', {
                createdSessionId: result.createdSessionId,
                authSession: result.authSessionResult?.type,
                signInStatus: result.signIn?.status,
                signUpStatus: result.signUp?.status,
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
            setIsLoading(false);
        }
    }, [startSSOFlow]);

    return (
        <View style={styles.container}>
            <View style={styles.top}>
                <View style={styles.logo}>
                    <Text style={styles.logoEmoji}>🎙️</Text>
                </View>

                <Text style={styles.brand}>SpeakTrack</Text>
                <Text style={styles.tagline}>Speak. Track. Improve.</Text>

                <Text style={styles.description}>
                    Practice English with AI conversations, get instant
                    corrections, and watch your speaking improve every day.
                </Text>

                <View style={styles.features}>
                    <Text style={styles.feature}>💬  AI voice conversations</Text>
                    <Text style={styles.feature}>✍️  Grammar corrections</Text>
                    <Text style={styles.feature}>📚  Vocabulary tracking</Text>
                    <Text style={styles.feature}>📈  Speaking progress</Text>
                </View>
            </View>

            <View style={styles.bottom}>
                {!!error && <Text style={styles.error}>{error}</Text>}

                <Pressable
                    style={({ pressed }) => [
                        styles.googleButton,
                        pressed && styles.pressed,
                        isLoading && styles.disabled,
                    ]}
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Text style={styles.googleG}>G</Text>
                            <Text style={styles.googleText}>Continue with Google</Text>
                        </>
                    )}
                </Pressable>

                <Text style={styles.terms}>
                    By continuing, you agree to our Terms and Privacy Policy.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingHorizontal: 24,
        paddingTop: 90,
        paddingBottom: 40,
        justifyContent: 'space-between',
    },

    top: {
        alignItems: 'center',
    },

    logo: {
        width: 84,
        height: 84,
        borderRadius: 28,
        backgroundColor: COLORS.lightPurple,
        alignItems: 'center',
        justifyContent: 'center',
    },

    logoEmoji: {
        fontSize: 40,
    },

    brand: {
        marginTop: 22,
        fontSize: 34,
        fontWeight: '800',
        color: COLORS.primary,
    },

    tagline: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.secondary,
    },

    description: {
        marginTop: 22,
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'center',
        color: COLORS.secondary,
    },

    features: {
        marginTop: 30,
        alignSelf: 'stretch',
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 20,
        gap: 14,
    },

    feature: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },

    bottom: {
        alignItems: 'center',
    },

    error: {
        color: COLORS.danger,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 14,
    },

    googleButton: {
        alignSelf: 'stretch',
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingVertical: 17,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    googleG: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginRight: 10,
    },

    googleText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    pressed: {
        opacity: 0.85,
    },

    disabled: {
        opacity: 0.7,
    },

    terms: {
        marginTop: 16,
        fontSize: 12,
        color: COLORS.secondary,
        textAlign: 'center',
    },
});