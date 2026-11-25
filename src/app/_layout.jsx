import { Stack } from 'expo-router';
import {
    useFonts,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';

import AppProviders from '../providers/AppProviders';
import { colors } from '../lib/theme';

export default function RootLayout() {
    const [loaded, error] = useFonts({
        InstrumentSerif_400Regular,
        InstrumentSerif_400Regular_Italic,
    });

    // Don't block the app forever if the font fails to load.
    if (!loaded && !error) return null;

    return (
        <AppProviders>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.cream },
                }}
            >
                <Stack.Screen name="speaking" options={{ gestureEnabled: false, animation: 'fade' }} />
            </Stack>
        </AppProviders>
    );
}