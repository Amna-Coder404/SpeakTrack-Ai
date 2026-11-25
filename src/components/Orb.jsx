import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

// The glowing sphere from the design, built from layered circles (no extra libraries).
export default function Orb({ size = 160, pulse = false, glow = true }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) {
      Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.07,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.97,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, scale]);

  const s = size;
  return (
    <Animated.View style={{ width: s, height: s, transform: [{ scale }] }}>
      {glow && (
        <>
          <View
            style={{
              position: 'absolute',
              left: -s * 0.3,
              top: -s * 0.3,
              width: s * 1.6,
              height: s * 1.6,
              borderRadius: s,
              backgroundColor: 'rgba(232,102,61,0.06)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: -s * 0.15,
              top: -s * 0.15,
              width: s * 1.3,
              height: s * 1.3,
              borderRadius: s,
              backgroundColor: 'rgba(232,102,61,0.12)',
            }}
          />
        </>
      )}
      <View
        style={{
          width: s,
          height: s,
          borderRadius: s / 2,
          overflow: 'hidden',
          backgroundColor: '#E8663D',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: -s * 0.1,
            top: -s * 0.15,
            width: s * 0.9,
            height: s * 0.9,
            borderRadius: s,
            backgroundColor: '#F6B26B',
          }}
        />
        <View
          style={{
            position: 'absolute',
            right: -s * 0.25,
            bottom: -s * 0.2,
            width: s * 0.85,
            height: s * 0.85,
            borderRadius: s,
            backgroundColor: '#F0708A',
            opacity: 0.9,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: s * 0.2,
            top: s * 0.2,
            width: s * 0.6,
            height: s * 0.6,
            borderRadius: s,
            backgroundColor: '#FFE9C7',
            opacity: 0.55,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: s * 0.32,
            top: s * 0.32,
            width: s * 0.36,
            height: s * 0.36,
            borderRadius: s,
            backgroundColor: '#FFF6E6',
            opacity: 0.75,
          }}
        />
      </View>
    </Animated.View>
  );
}
