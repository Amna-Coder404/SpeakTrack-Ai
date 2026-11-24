import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';

import { ConvexProviderWithClerk } from 'convex/react-clerk';

import { convex } from '../lib/convex';

const publishableKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

export default function AppProviders({ children }) {
    return (
        <ClerkProvider
            publishableKey={publishableKey}
            tokenCache={tokenCache}
        >
            <ConvexProviderWithClerk
                client={convex}
                useAuth={useAuth}
            >
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}