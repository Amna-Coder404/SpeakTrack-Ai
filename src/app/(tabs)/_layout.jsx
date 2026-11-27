
import { Redirect, Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';

import useSyncUser from '../../hooks/useSyncUser';
import { colors, fonts } from '../../lib/theme';

const tabIcons = {
    home: ['home', 'home-outline'],
    progress: ['stats-chart', 'stats-chart-outline'],
    profile: ['person', 'person-outline'],
};

function TabIcon({ name, focused, color, size }) {
    const [activeIcon, inactiveIcon] = tabIcons[name];

    return (
        <Ionicons
            name={focused ? activeIcon : inactiveIcon}
            size={size}
            color={color}
        />
    );
}

export default function TabsLayout() {
    const { isLoaded, isSignedIn } = useAuth();

    useSyncUser();

    if (!isLoaded) return null;

    if (!isSignedIn) {
        return <Redirect href="/welcome" />;
    }

    return (
        <>
            <StatusBar style="dark" />

            <Tabs
                screenOptions={{
                    headerShown: false,

                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.muted,

                    tabBarStyle: {
                        backgroundColor: colors.tabBar,
                        borderTopColor: colors.tabBorder,
                        borderTopWidth: 1,
                        height: 68,
                        paddingTop: 8,
                        paddingBottom: 8,
                        elevation: 0,
                        shadowOpacity: 0,
                    },

                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontFamily: fonts.medium,
                        fontWeight: '600',
                    },

                    tabBarIconStyle: {
                        marginBottom: 2,
                    },

                    tabBarItemStyle: {
                        paddingVertical: 2,
                    },
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        title: 'Home',
                        tabBarIcon: (props) => (
                            <TabIcon name="home" {...props} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="progress"
                    options={{
                        title: 'Progress',
                        tabBarIcon: (props) => (
                            <TabIcon name="progress" {...props} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: (props) => (
                            <TabIcon name="profile" {...props} />
                        ),
                    }}
                />
            </Tabs>
        </>
    );
}
