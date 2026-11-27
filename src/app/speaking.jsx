
import React from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView, ActivityIndicator
} from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';

import { useSpeaking } from '../hooks/useSpeaking';
import styles from '../styles/speaking.style';
import TypingDots from '../components/TypingDots';

export default function SpeakingScreen() {
    const { isSignedIn, isLoaded } = useAuth();

    const {
        messages,
        status,
        muted,
        seconds,
        liveText,
        error,
        handleMic,
        handleMute,
        handleEnd,
    } = useSpeaking();

    const isThinking = status === 'thinking';
    const isListening = status === 'listening';

    if (!isLoaded) return null;
    if (!isSignedIn) {
        return <Redirect href="/(auth)/welcome" />;
    }

    const formatTime = (value) => {
        const minutes = Math.floor(value / 60);
        const remainingSeconds = value % 60;

        return `${String(minutes).padStart(2, '0')}:${String(
            remainingSeconds
        ).padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>SpeakTrack</Text>
                    <Text style={styles.subtitle}>Your speaking session</Text>
                </View>

                <View style={styles.timerContainer}>
                    <View style={styles.timerDot} />
                    <Text style={styles.timer}>{formatTime(seconds)}</Text>
                </View>
            </View>

            <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.status}>
                    {isThinking ? 'THINKING...' : isListening ? 'LISTENING...' : status.toUpperCase()}
                </Text>
            </View>

            <ScrollView
                style={styles.chat}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.message,
                            message.role === 'user'
                                ? styles.userMessage
                                : styles.aiMessage,
                        ]}
                    >
                        <Text style={styles.messageText}>
                            {message.text}
                        </Text>
                    </View>
                ))}

                {!!liveText && (
                    <View style={styles.liveContainer}>
                        <Text style={styles.liveLabel}>LIVE TRANSCRIPTION</Text>
                        <Text style={styles.liveText}>{liveText}</Text>
                    </View>
                )}
                {isThinking && (
                    <View style={[styles.message, styles.aiMessage]}>
                        <TypingDots />
                    </View>
                )}
                {messages.length === 0 && !liveText && (
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name="chatbubble-ellipses-outline"
                            size={30}
                            color="#E96D4A"
                        />
                        <Text style={styles.emptyTitle}>
                            Start speaking
                        </Text>
                        <Text style={styles.emptyText}>
                            Your conversation will appear here.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.controls}>
                <Pressable
                    style={styles.secondaryButton}
                    onPress={handleMute}
                >
                    <Ionicons
                        name={muted ? 'volume-mute' : 'volume-high'}
                        size={23}
                        color="#171613"
                    />
                    <Text style={styles.secondaryButtonText}>
                        {muted ? 'Unmute' : 'Mute'}
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.micButton}
                    onPress={handleMic}
                >
                    <Ionicons
                        name="mic"
                        size={29}
                        color="#FFFFFF"
                    />
                </Pressable>

                <Pressable
                    style={styles.endButton}
                    onPress={handleEnd}
                >
                    <Ionicons
                        name="call"
                        size={23}
                        color="#FFFFFF"
                        style={{ transform: [{ rotate: '135deg' }] }}
                    />
                    <Text style={styles.endButtonText}>End</Text>
                </Pressable>
            </View>
        </View>
    );
}
