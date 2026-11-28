import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useAction, useConvexAuth, useQuery } from 'convex/react';
import * as Speech from 'expo-speech';

import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import { api } from '../../convex/_generated/api';

// How long silence must last before your sentence is sent (milliseconds).
// Lower = faster reply. If it cuts you off while thinking, use 1800.
const SILENCE_MS = 2000;

// Shared by every instance of the hook, so a duplicate event can never send twice.
let lastSentText = '';
let lastSentAt = 0;

export function useSpeaking() {
    const { isSignedIn } = useAuth();
    const { isAuthenticated } = useConvexAuth();

    const me = useQuery(api.users.me);

    const startSession = useAction(api.ai.startSession);
    const respond = useAction(api.ai.respond);
    const finishSession = useAction(api.ai.finishSession);

    // UI state
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('starting');
    const [muted, setMuted] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [liveText, setLiveText] = useState('');
    const [error, setError] = useState('');
    const [sessionActive, setSessionActive] = useState(false);

    // Session references
    const sessionIdRef = useRef(null);
    const secondsRef = useRef(0);

    const statusRef = useRef('starting');
    const mutedRef = useRef(false);

    const endingRef = useRef(false);
    const startingRef = useRef(false);
    const processingRef = useRef(false);

    const lastTextRef = useRef('');
    const confidenceRef = useRef(null);

    const voiceRef = useRef('en-US');
    const endSessionRef = useRef(null);

    const limitSec = (me?.sessionMinutes || 10) * 60;

    // Update status
    const changeStatus = useCallback((value) => {
        statusRef.current = value;
        setStatus(value);
    }, []);

    // Add conversation message
    const addMessage = useCallback((role, text) => {
        setMessages((previous) => [
            ...previous,
            {
                id: `${Date.now()}-${Math.random()}`,
                role,
                text,
            },
        ]);
    }, []);

    // Start microphone recognition
    const startListening = useCallback(async () => {
        if (
            endingRef.current ||
            mutedRef.current ||
            !sessionIdRef.current
        ) {
            return;
        }

        try {
            const permission =
                await ExpoSpeechRecognitionModule.requestPermissionsAsync();

            if (!permission.granted) {
                setError('Microphone permission is required.');
                changeStatus('idle');
                return;
            }

            if (endingRef.current) return;

            lastTextRef.current = '';
            confidenceRef.current = null;

            setLiveText('');
            setError('');

            changeStatus('listening');

            ExpoSpeechRecognitionModule.start({
                lang: voiceRef.current,
                interimResults: true,
                continuous: false,
                androidIntentOptions: {
                    EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: SILENCE_MS,
                    EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: SILENCE_MS,
                },
            });
        } catch (err) {
            console.log('Recognition start error:', err);

            setError('Could not start speech recognition.');
            changeStatus('idle');
        }
    }, [changeStatus]);

    // AI speech completed
    const afterSpeech = useCallback(() => {
        console.log('afterSpeech, status =', statusRef.current);

        if (
            endingRef.current ||
            statusRef.current !== 'speaking'
        ) {
            return;
        }

        changeStatus('idle');

        if (!mutedRef.current) {
            startListening();
        }
    }, [changeStatus, startListening]);

    // AI text-to-speech
    const speak = useCallback((text) => {
        if (!text || endingRef.current) return;

        changeStatus('speaking');

        Speech.stop();

        Speech.speak(text, {
            language: voiceRef.current,
            rate: 0.95,

            onDone: afterSpeech,

            onError: (err) => {
                console.log('Speech error:', err);
                afterSpeech();
            },
        });
    }, [afterSpeech, changeStatus]);

    // Get AI response
    const getReply = useCallback(async (text, confidence) => {
        if (!sessionIdRef.current || endingRef.current) return;

        try {
            changeStatus('thinking');
            setError('');

            const result = await respond({
                sessionId: sessionIdRef.current,
                text,
                ...(typeof confidence === 'number'
                    ? { confidence }
                    : {}),
            });

            console.log('AI result:', result);

            if (endingRef.current) return;

            if (!result?.reply) {
                setError('AI returned an empty reply.');
                changeStatus('idle');
                return;
            }

            addMessage('ai', result.reply);

            speak(result.reply);
        } catch (err) {
            console.log('AI response error:', err);

            if (!endingRef.current) {
                setError('Could not get an AI response.');
                changeStatus('idle');
            }
        }
    }, [respond, addMessage, speak, changeStatus]);

    // Send learner's speech
    const sendTurn = useCallback(async (text) => {
        if (
            !text?.trim() ||
            endingRef.current ||
            processingRef.current
        ) {
            return;
        }

        // Ignore a duplicate of the same sentence sent a moment ago.
        const clean = text.trim();
        const now = Date.now();
        if (clean === lastSentText && now - lastSentAt < 3000) return;
        lastSentText = clean;
        lastSentAt = now;

        processingRef.current = true;

        const confidence = confidenceRef.current;

        lastTextRef.current = '';
        confidenceRef.current = null;

        try {
            changeStatus('thinking');
            addMessage('user', clean);
            setLiveText('');

            await getReply(clean, confidence);
        } finally {
            processingRef.current = false;
        }
    }, [addMessage, getReply, changeStatus]);

    // Speech recognition result
    useSpeechRecognitionEvent('result', (event) => {
        const result = event.results?.[0];

        if (!result || endingRef.current) return;

        const transcript = result.transcript || '';

        setLiveText(transcript);

        // Keep the latest text (final or not), so `end` always has text
        lastTextRef.current = transcript;

        if (result.isFinal) {
            confidenceRef.current = result.confidence ?? null;
        }
    });

    // Speech recognition error
    useSpeechRecognitionEvent('error', (event) => {
        if (endingRef.current) return;

        console.log('Recognition error:', event);

        if (event.error === 'no-speech') {
            setError('No speech detected. Please try again.');
            changeStatus('idle');
            return;
        }

        if (event.error === 'aborted') return;

        setError(event.message || 'Speech recognition error.');
        changeStatus('idle');
    });

    // Recognition completed
    useSpeechRecognitionEvent('end', () => {
        if (endingRef.current) return;

        const text = lastTextRef.current.trim();
        lastTextRef.current = ''; // a second 'end' event will now find nothing

        console.log('Recognition end, text =', text);

        if (text) {
            sendTurn(text);
        } else {
            changeStatus('idle');
        }
    });

    // Start a new conversation
    const begin = useCallback(async () => {
        if (
            startingRef.current ||
            sessionIdRef.current ||
            endingRef.current
        ) {
            return;
        }

        startingRef.current = true;
        endingRef.current = false;

        try {
            changeStatus('starting');
            setError('');
            setMessages([]);
            setSeconds(0);
            secondsRef.current = 0;

            const result = await startSession({
                topic: 'Daily Conversation',
            });

            if (endingRef.current) return;

            sessionIdRef.current = result.sessionId;

            setSessionActive(true);

            addMessage('ai', result.reply);

            speak(result.reply);
        } catch (err) {
            console.log('Start session error:', err);

            setError('Could not start your speaking session.');
            changeStatus('idle');
        } finally {
            startingRef.current = false;
        }
    }, [startSession, changeStatus, addMessage, speak]);

    // Microphone button
    const handleMic = useCallback(async () => {
        if (endingRef.current) return;

        if (!sessionIdRef.current) {
            await begin();
            return;
        }

        if (statusRef.current === 'listening') {
            ExpoSpeechRecognitionModule.stop();
            return;
        }

        if (statusRef.current === 'thinking') {
            return;
        }

        if (statusRef.current === 'speaking') {
            Speech.stop();
            changeStatus('idle');
        }

        await startListening();
    }, [begin, changeStatus, startListening]);

    // Mute automatic microphone listening
    const handleMute = useCallback(() => {
        const nextValue = !mutedRef.current;

        mutedRef.current = nextValue;
        setMuted(nextValue);

        if (nextValue) {
            if (statusRef.current === 'listening') {
                ExpoSpeechRecognitionModule.abort();
                changeStatus('idle');
            }
        } else if (
            sessionIdRef.current &&
            statusRef.current === 'idle'
        ) {
            startListening();
        }
    }, [changeStatus, startListening]);

    // End session and open the result screen
    const handleEnd = useCallback(async () => {
        if (endingRef.current) return;

        endingRef.current = true;

        Speech.stop();
        ExpoSpeechRecognitionModule.abort();

        changeStatus('ending');

        const sessionId = sessionIdRef.current; // save before clearing
        let finished = false;

        try {
            if (sessionId) {
                await finishSession({
                    sessionId,
                    durationSec: Number(secondsRef.current),
                });

                finished = true;
            }
        } catch (err) {
            console.log('Finish session error:', err);

            Alert.alert(
                'Session Error',
                err.message || 'Could not finish your session.'
            );
        } finally {
            sessionIdRef.current = null;

            setSessionActive(false);
            setMessages([]);
            setLiveText('');
            setSeconds(0);

            secondsRef.current = 0;
            changeStatus('idle');

            mutedRef.current = false;
            setMuted(false);

            if (finished && sessionId) {
                router.replace(`/result/${sessionId}`);
            } else {
                router.replace('/home');
            }
        }
    }, [finishSession, changeStatus]);

    // Keep end-session callback updated for the timer
    useEffect(() => {
        endSessionRef.current = handleEnd;
    }, [handleEnd]);

    // Update selected voice
    useEffect(() => {
        voiceRef.current = me?.voice || 'en-US';
    }, [me?.voice]);

    // Automatically start session after authentication
    useEffect(() => {
        if (
            isSignedIn &&
            isAuthenticated &&
            me &&
            !sessionIdRef.current &&
            !startingRef.current
        ) {
            begin();
        }
    }, [isSignedIn, isAuthenticated, me, begin]);

    // Stable session timer
    useEffect(() => {
        if (!sessionActive) return;

        const interval = setInterval(() => {
            if (endingRef.current) return;

            const next = secondsRef.current + 1;

            secondsRef.current = next;
            setSeconds(next);

            if (next >= limitSec) {
                clearInterval(interval);
                endSessionRef.current?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [sessionActive, limitSec]);

    // Cleanup
    useEffect(() => {
        return () => {
            endingRef.current = true;

            Speech.stop();

            ExpoSpeechRecognitionModule.abort();
        };
    }, []);

    return {
        messages,
        status,
        muted,
        seconds,
        liveText,
        error,
        me,
        handleMic,
        handleMute,
        handleEnd,
    };
}