
import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const syncCurrentUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        imageUrl: v.optional(v.string()),
    },

    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error('Authentication required');
        }

        // Always get the account ID from the verified Clerk token.
        const clerkId = identity.subject;

        const existingUser = await ctx.db
            .query('users')
            .withIndex('by_clerk_id', (q) =>
                q.eq('clerkId', clerkId)
            )
            .unique();

        const now = Date.now();

        const profile = {
            name: args.name,
            email: args.email,
            ...(args.imageUrl ? { imageUrl: args.imageUrl } : {}),
            updatedAt: now,
        };

        if (existingUser) {
            await ctx.db.patch(existingUser._id, profile);

            return existingUser._id;
        }

        return await ctx.db.insert('users', {
            clerkId,
            ...profile,
            createdAt: now,
        });
    },
});
