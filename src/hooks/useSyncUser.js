import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/expo';
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Saves the signed-in Clerk user into Convex (once per app start).
export default function useSyncUser() {
    const { user, isLoaded } = useUser();
    const { isAuthenticated } = useConvexAuth();
    const syncCurrentUser = useMutation(api.users.syncCurrentUser);
    const done = useRef(false);

    useEffect(() => {
        if (done.current || !isLoaded || !user || !isAuthenticated) return;

        const email = user.primaryEmailAddress?.emailAddress;
        if (!email) return;

        done.current = true;
        console.log('Clerk user:', user.id, email);

        syncCurrentUser({
            name: user.fullName || user.firstName || 'Learner',
            email,
            ...(user.imageUrl ? { imageUrl: user.imageUrl } : {}),
        })
            .then((res) => console.log('Convex sync result:', res))
            .catch((err) => {
                done.current = false;
                console.error('Convex sync failed:', err);
            });
    }, [isLoaded, user, isAuthenticated, syncCurrentUser]);
}