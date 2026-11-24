import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/expo';

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

export default function HomeScreen() {
    const { signOut } = useAuth();
    const { user } = useUser();

    const [isSigningOut, setIsSigningOut] = useState(false);

    const firstName =
        user?.firstName ||
        user?.username ||
        user?.fullName?.split(' ')[0] ||
        'Learner';

    const email = user?.primaryEmailAddress?.emailAddress || '';

    const handleSignOut = async () => {
        try {
            setIsSigningOut(true);
            await signOut();
            router.replace('/welcome');
        } catch (error) {
            Alert.alert(
                'Sign out failed',
                error?.message || 'Please try again.'
            );
        } finally {
            setIsSigningOut(false);
        }
    };

    const handleStartSpeaking = () => {
        router.push('/practice');
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.brand}>SpeakTrack</Text>
                        <Text style={styles.tagline}>Speak. Track. Improve.</Text>
                    </View>

                    {user?.imageUrl ? (
                        <Image
                            source={{ uri: user.imageUrl }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>
                                {firstName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Welcome */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.greeting}>Hello, {firstName}!</Text>
                    <Text style={styles.description}>
                        Ready to improve your English speaking today?
                    </Text>
                </View>

                {/* Main Practice Card */}
                <View style={styles.practiceCard}>
                    <View style={styles.practiceIcon}>
                        <Text style={styles.micIcon}>🎙️</Text>
                    </View>

                    <Text style={styles.practiceTitle}>
                        Your speaking journey starts here.
                    </Text>

                    <Text style={styles.practiceDescription}>
                        Practice real conversations, learn from corrections,
                        and build confidence every day.
                    </Text>

                    <Pressable
                        style={({ pressed }) => [
                            styles.startButton,
                            pressed && styles.buttonPressed,
                        ]}
                        onPress={handleStartSpeaking}
                    >
                        <Text style={styles.startButtonText}>Start Speaking</Text>
                        <Text style={styles.buttonArrow}>→</Text>
                    </Pressable>
                </View>

                {/* Features */}
                <Text style={styles.sectionTitle}>Your learning journey</Text>

                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Text>💬</Text>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>AI Conversations</Text>
                        <Text style={styles.featureDescription}>
                            Practice speaking through natural conversations.
                        </Text>
                    </View>
                </View>

                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Text>✍️</Text>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Grammar Corrections</Text>
                        <Text style={styles.featureDescription}>
                            Understand mistakes and learn better expressions.
                        </Text>
                    </View>
                </View>

                <View style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                        <Text>📈</Text>
                    </View>
                    <View style={styles.featureContent}>
                        <Text style={styles.featureTitle}>Speaking Progress</Text>
                        <Text style={styles.featureDescription}>
                            Track your practice sessions and improvement.
                        </Text>
                    </View>
                </View>

                {/* Account */}
                <View style={styles.accountCard}>
                    <Text style={styles.accountTitle}>Your account</Text>
                    <Text style={styles.accountEmail}>{email}</Text>
                </View>

                {/* Sign Out */}
                <Pressable
                    style={({ pressed }) => [
                        styles.signOutButton,
                        pressed && styles.buttonPressed,
                        isSigningOut && styles.disabledButton,
                    ]}
                    onPress={handleSignOut}
                    disabled={isSigningOut}
                >
                    {isSigningOut ? (
                        <ActivityIndicator color={COLORS.danger} />
                    ) : (
                        <Text style={styles.signOutText}>Sign out</Text>
                    )}
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    scrollContent: {
        paddingHorizontal: 22,
        paddingTop: 60,
        paddingBottom: 35,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    brand: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.primary,
    },

    tagline: {
        fontSize: 12,
        color: COLORS.secondary,
        marginTop: 3,
    },

    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.lightPurple,
    },

    avatarPlaceholder: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.lightPurple,
        alignItems: 'center',
        justifyContent: 'center',
    },

    avatarText: {
        color: COLORS.primary,
        fontSize: 19,
        fontWeight: '700',
    },

    welcomeSection: {
        marginTop: 38,
        marginBottom: 25,
    },

    greeting: {
        fontSize: 29,
        fontWeight: '800',
        color: COLORS.text,
    },

    description: {
        fontSize: 15,
        lineHeight: 23,
        color: COLORS.secondary,
        marginTop: 9,
    },

    practiceCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        padding: 22,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    practiceIcon: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: COLORS.lightPurple,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },

    micIcon: {
        fontSize: 27,
    },

    practiceTitle: {
        fontSize: 21,
        fontWeight: '800',
        lineHeight: 29,
        color: COLORS.text,
    },

    practiceDescription: {
        fontSize: 14,
        lineHeight: 22,
        color: COLORS.secondary,
        marginTop: 10,
    },

    startButton: {
        marginTop: 24,
        backgroundColor: COLORS.primary,
        borderRadius: 15,
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    startButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    buttonArrow: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        marginLeft: 10,
    },

    buttonPressed: {
        opacity: 0.8,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: COLORS.text,
        marginTop: 32,
        marginBottom: 15,
    },

    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },

    featureIcon: {
        width: 43,
        height: 43,
        borderRadius: 14,
        backgroundColor: COLORS.lightPurple,
        alignItems: 'center',
        justifyContent: 'center',
    },

    featureContent: {
        flex: 1,
        marginLeft: 14,
    },

    featureTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },

    featureDescription: {
        fontSize: 12,
        lineHeight: 18,
        color: COLORS.secondary,
        marginTop: 4,
    },

    accountCard: {
        backgroundColor: COLORS.surface,
        padding: 18,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginTop: 20,
    },

    accountTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.text,
    },

    accountEmail: {
        fontSize: 13,
        color: COLORS.secondary,
        marginTop: 8,
    },

    signOutButton: {
        marginTop: 22,
        paddingVertical: 15,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#F1DADA',
        alignItems: 'center',
        backgroundColor: '#FFF9F9',
    },

    signOutText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.danger,
    },

    disabledButton: {
        opacity: 0.6,
    },
});