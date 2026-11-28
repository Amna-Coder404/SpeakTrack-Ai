
import React, { useState } from 'react';
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

import SpeakingAvatar from '../components/SpeakingAvatar';


export default function SpeakingScreen() {
    const { isSignedIn, isLoaded } = useAuth();

    const [showText, setShowText] = useState();
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
    const isBusy = status === 'starting' || status === 'ending';


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
                <Pressable onPress={() => setShowText((v) => !v)} hitSlop={10}>
                    <Ionicons
                        name={showText ? 'chatbubble' : 'chatbubble-outline'}
                        size={22}
                        color="#171613"
                    />
                </Pressable>
            </View>

            <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.status}>
                    {isThinking ? 'THINKING...' : isListening ? 'LISTENING...' : status.toUpperCase()}
                </Text>
            </View>

            {showText ? (
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
            ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <SpeakingAvatar status={status} />
                </View>
            )}

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
            {isBusy && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        zIndex: 10,
                    }}
                >
                    <ActivityIndicator size="large" color="#E96D4A" />
                    <Text style={{ marginTop: 12, color: '#171613', fontWeight: '700' }}>
                        {status === 'ending' ? 'Analyzing your session...' : 'Starting session...'}
                    </Text>
                </View>
            )}
        </View>
    );
}
