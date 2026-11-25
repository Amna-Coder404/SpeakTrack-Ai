
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@clerk/expo';
import { useAction, useConvexAuth, useQuery } from 'convex/react';
import * as Speech from 'expo-speech';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import { api } from '../../convex/_generated/api';

export function useSpeaking() {
    const { isSignedIn } = useAuth();
    const { isAuthenticated } = useConvexAuth();

    const me = useQuery(api.users.me);

    const startSession = useAction(api.ai.startSession);
    const respond = useAction(api.ai.respond);
    const finishSession = useAction(api.ai.finishSession);

    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState('starting');
    const [muted, setMuted] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [liveText, setLiveText] = useState('');
    const [error, setError] = useState('');

    const sessionIdRef = useRef(null);
    const statusRef = useRef('starting');
    const mutedRef = useRef(false);
    const endingRef = useRef(false);
    const startingRef = useRef(false);
    const lastTextRef = useRef('');
    const confidenceRef = useRef(null);
    const secondsRef = useRef(0);

    const voiceRef = useRef('en-US');

    const limitSec = (me?.sessionMinutes || 10) * 60;

    // Keep refs synchronized with state
    const changeStatus = useCallback((value) => {
        statusRef.current = value;
        setStatus(value);
    }, []);

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

    // AI text-to-speech
    const afterSpeech = useCallback(() => {
        if (endingRef.current || statusRef.current !== 'speaking') return;

        changeStatus('idle');

        if (!mutedRef.current) {
            startListening();
        }
    }, [changeStatus]);

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

    // User speech recognition
    const startListening = async () => {
        if (endingRef.current) return;

        try {
            const permission =
                await ExpoSpeechRecognitionModule.requestPermissionsAsync();

            if (!permission.granted) {
                setError('Microphone permission is required.');
                changeStatus('idle');
                return;
            }

            lastTextRef.current = '';
            confidenceRef.current = null;
            setLiveText('');
            changeStatus('listening');

            ExpoSpeechRecognitionModule.start({
                lang: voiceRef.current,
                interimResults: true,
                continuous: false,
                androidIntentOptions: {
                    EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 3000,
                },
            });
        } catch (err) {
            console.log('Recognition error:', err);
            setError('Could not start speech recognition.');
            changeStatus('idle');
        }
    };

    // Receive recognized text
    useSpeechRecognitionEvent('result', (event) => {
        const result = event.results?.[0];

        if (!result) return;

        const transcript = result.transcript || '';

        setLiveText(transcript);

        if (result.isFinal) {
            lastTextRef.current = transcript;
            confidenceRef.current = result.confidence ?? null;
        }
    });

    useSpeechRecognitionEvent('error', (event) => {
        console.log('Recognition error:', event);
        setError(event.message || 'Speech recognition error.');
    });

    // Send user message to AI
    const getReply = async (text, confidence) => {
        if (!sessionIdRef.current || endingRef.current) return;

        try {
            changeStatus('thinking');

            const result = await respond({
                sessionId: sessionIdRef.current,
                text,
                confidence,
            });

            if (endingRef.current) return;

            addMessage('ai', result.reply);
            speak(result.reply);
        } catch (err) {
            console.log('AI response error:', err);
            setError('Could not get an AI response.');
            changeStatus('idle');
        }
    };

    const sendTurn = async (text) => {
        if (!text?.trim()) return;

        addMessage('user', text);
        setLiveText('');

        await getReply(text, confidenceRef.current);
    };

    // Recognition ended
    useSpeechRecognitionEvent('end', () => {
        if (endingRef.current) return;

        const text = lastTextRef.current.trim();

        if (text) {
            sendTurn(text);
        } else {
            changeStatus('idle');
        }
    });

    // Start conversation
    const begin = async () => {
        if (startingRef.current || sessionIdRef.current) return;

        startingRef.current = true;
        endingRef.current = false;

        try {
            changeStatus('starting');

            const result = await startSession({});

            sessionIdRef.current = result.sessionId;

            addMessage('ai', result.reply);
            speak(result.reply);
        } catch (err) {
            console.log('Start session error:', err);
            setError('Could not start your speaking session.');
            changeStatus('idle');
        } finally {
            startingRef.current = false;
        }
    };

    // Microphone button
    const handleMic = async () => {
        if (!sessionIdRef.current) {
            await begin();
            return;
        }

        if (statusRef.current === 'listening') {
            ExpoSpeechRecognitionModule.stop();
            return;
        }

        if (statusRef.current === 'speaking') {
            Speech.stop();
            changeStatus('idle');
            await startListening();
            return;
        }

        await startListening();
    };

    // Toggle automatic listening
    const handleMute = () => {
        const nextValue = !mutedRef.current;

        mutedRef.current = nextValue;
        setMuted(nextValue);

        if (nextValue && statusRef.current === 'listening') {
            ExpoSpeechRecognitionModule.abort();
            changeStatus('idle');
        }
    };

    // End session
    const handleEnd = async () => {
        if (endingRef.current) return;

        endingRef.current = true;

        Speech.stop();
        ExpoSpeechRecognitionModule.abort();

        changeStatus('ending');

        try {
            if (sessionIdRef.current) {
                await finishSession({
                    sessionId: sessionIdRef.current,
                });
            }
        } catch (err) {
            console.log('Finish session error:', err);
            Alert.alert('Error', 'Could not finish the session.');
        } finally {
            sessionIdRef.current = null;
            changeStatus('idle');
        }
    };

    // Update selected recognition language
    useEffect(() => {
        voiceRef.current = me?.voice || 'en-US';
    }, [me?.voice]);

    // Auto-start session after authentication
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
    }, [isSignedIn, isAuthenticated, me]);

    // Session timer
    useEffect(() => {
        if (!sessionIdRef.current || status === 'ending') return;

        const interval = setInterval(() => {
            setSeconds((previous) => {
                const next = previous + 1;
                secondsRef.current = next;

                if (next >= limitSec) {
                    clearInterval(interval);
                    handleEnd();
                }

                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [sessionIdRef.current, status, limitSec]);

    // Cleanup
    useEffect(() => {
        return () => {
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
