import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';

import useSyncUser from '../../hooks/useSyncUser';
import { colors } from '../../lib/theme';

const icon = (on, off) =>
    function TabIcon({ focused, color, size }) {
        return <Ionicons name={focused ? on : off} size={size} color={color} />;
    };

export default function TabsLayout() {
    const { isLoaded, isSignedIn } = useAuth();
    useSyncUser();

    if (!isLoaded) return null;
    if (!isSignedIn) return <Redirect href="/welcome" />;

    return (
        <>
            <StatusBar style="dark" />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: colors.text,
                    tabBarInactiveTintColor: colors.muted,
                    tabBarStyle: { backgroundColor: colors.cream, borderTopColor: colors.border },
                    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                }}
            >
                <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
                <Tabs.Screen
                    name="progress"
                    options={{ title: 'Progress', tabBarIcon: icon('stats-chart', 'stats-chart-outline') }}
                />
                <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
            </Tabs>
        </>
    );
}