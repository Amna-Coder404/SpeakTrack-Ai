import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

const LABELS = {
    speaking: 'Speaking...',
    listening: 'Your turn, speak now',
    thinking: 'Thinking...',
    starting: 'Getting ready...',
    ending: 'Finishing...',
    idle: 'Tap the mic to speak',
};

// Middle bars are taller, like a real voice wave
const WEIGHTS = [0.6, 0.85, 1, 0.85, 0.6];

export default function SpeakingAvatar({ status }) {
    const pulse = useRef(new Animated.Value(0)).current;
    const bars = useRef(WEIGHTS.map(() => new Animated.Value(0.15))).current;

    const mode =
        status === 'speaking'
            ? 'speak'
            : status === 'listening'
                ? 'listen'
                : status === 'thinking'
                    ? 'think'
                    : 'idle';

    // Soft breathing glow around the orb
    useEffect(() => {
        const duration = mode === 'speak' ? 600 : 1400;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [mode, pulse]);

    // Voice wave bars
    useEffect(() => {
        let alive = true;
        bars.forEach((v) => v.stopAnimation());

        if (mode === 'idle') {
            bars.forEach((v) =>
                Animated.timing(v, { toValue: 0.15, duration: 250, useNativeDriver: true }).start()
            );
            return;
        }

        if (mode === 'think') {
            const loop = Animated.loop(
                Animated.stagger(
                    120,
                    bars.map((v) =>
                        Animated.sequence([
                            Animated.timing(v, { toValue: 0.6, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                            Animated.timing(v, { toValue: 0.15, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                        ])
                    )
                )
            );
            loop.start();
            return () => loop.stop();
        }

        // speak / listen: irregular, natural movement
        const peak = mode === 'speak' ? 1 : 0.4;
        const run = (v, i) => {
            if (!alive) return;
            const target = Math.max(0.15, (0.2 + Math.random() * 0.8) * peak * WEIGHTS[i]);
            const duration = mode === 'speak' ? 110 + Math.random() * 150 : 300 + Math.random() * 300;
            Animated.timing(v, {
                toValue: target,
                duration,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            }).start(({ finished }) => finished && run(v, i));
        };
        bars.forEach((v, i) => run(v, i));

        return () => {
            alive = false;
            bars.forEach((v) => v.stopAnimation());
        };
    }, [mode, bars]);

    const glowScale = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, mode === 'speak' ? 1.45 : 1.25],
    });
    const glowOpacity = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [mode === 'idle' ? 0 : 0.3, 0],
    });
    const orbScale = pulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, mode === 'speak' ? 1.06 : 1.02],
    });

    return (
        <View style={s.wrap}>
            <View style={s.stage}>
                <Animated.View
                    style={[s.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
                />
                <Animated.View style={[s.orb, { transform: [{ scale: orbScale }] }]}>
                    <View style={s.barsRow}>
                        {bars.map((v, i) => (
                            <Animated.View key={i} style={[s.bar, { transform: [{ scaleY: v }] }]} />
                        ))}
                    </View>
                </Animated.View>
            </View>
            <Text style={s.label}>{LABELS[status] || ''}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { alignItems: 'center' },
    stage: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
    glow: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#E96D4A',
    },
    orb: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#E96D4A',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#E96D4A',
        shadowOpacity: 0.45,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    barsRow: { flexDirection: 'row', alignItems: 'center', gap: 9, height: 70 },
    bar: { width: 9, height: 70, borderRadius: 5, backgroundColor: '#FFFFFF' },
});