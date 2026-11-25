
import React from 'react';
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@clerk/expo';

import { useSpeaking } from '../hooks/useSpeaking';

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
            <StatusBar style="light" />

            <View style={styles.header}>
                <Text style={styles.title}>SpeakTrack</Text>
                <Text style={styles.timer}>{formatTime(seconds)}</Text>
            </View>

            <Text style={styles.status}>{status.toUpperCase()}</Text>

            <ScrollView
                style={styles.chat}
                contentContainerStyle={styles.chatContent}
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
                        <Text style={styles.messageText}>{message.text}</Text>
                    </View>
                ))}

                {!!liveText && (
                    <Text style={styles.liveText}>{liveText}</Text>
                )}
            </ScrollView>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.controls}>
                <Pressable style={styles.button} onPress={handleMute}>
                    <Text style={styles.buttonText}>
                        {muted ? 'Unmute' : 'Mute'}
                    </Text>
                </Pressable>

                <Pressable style={styles.micButton} onPress={handleMic}>
                    <Text style={styles.buttonText}>Mic</Text>
                </Pressable>

                <Pressable style={styles.button} onPress={handleEnd}>
                    <Text style={styles.buttonText}>End</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#10111B',
        paddingTop: 55,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 23,
        fontWeight: '700',
    },
    timer: {
        color: '#FFFFFF',
        fontSize: 18,
    },
    status: {
        color: '#A78BFA',
        textAlign: 'center',
        marginTop: 30,
        fontWeight: '600',
    },
    chat: {
        flex: 1,
        marginTop: 25,
    },
    chatContent: {
        gap: 14,
        paddingBottom: 20,
    },
    message: {
        padding: 14,
        borderRadius: 16,
        maxWidth: '85%',
    },
    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#25263A',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#6941C6',
    },
    messageText: {
        color: '#FFFFFF',
        fontSize: 15,
    },
    liveText: {
        color: '#A78BFA',
        fontSize: 15,
        marginTop: 10,
    },
    error: {
        color: '#F87171',
        textAlign: 'center',
        marginBottom: 10,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 25,
    },
    button: {
        backgroundColor: '#25263A',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 30,
    },
    micButton: {
        backgroundColor: '#6941C6',
        paddingHorizontal: 30,
        paddingVertical: 18,
        borderRadius: 40,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
