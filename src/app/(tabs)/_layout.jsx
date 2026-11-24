import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import useSyncUser from '../../hooks/useSyncUser';

export default function TabsLayout() {
    const { isLoaded, isSignedIn } = useAuth();
    useSyncUser();

    if (!isLoaded) return null;
    if (!isSignedIn) return <Redirect href="/welcome" />;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#6845D9',
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="practice"
                options={{
                    title: 'Practice',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="mic" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}