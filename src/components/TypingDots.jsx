import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

function Dot({ delay }) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [delay, opacity]);

    return <Animated.View style={[dotStyles.dot, { opacity }]} />;
}

export default function TypingDots() {
    return (
        <View style={dotStyles.row}>
            <Dot delay={0} />
            <Dot delay={150} />
            <Dot delay={300} />
        </View>
    );
}

const dotStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E96D4A' },
});