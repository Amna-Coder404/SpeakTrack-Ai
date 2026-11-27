import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

async function findUser(ctx, clerkId) {
    return ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
        .unique();
}

export const syncCurrentUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('User is not authenticated');

        const clerkId = identity.subject;
        const existing = await findUser(ctx, clerkId);
        const now = Date.now();

        const profile = {
            name: args.name,
            email: args.email,
            ...(args.imageUrl ? { imageUrl: args.imageUrl } : {}),
            updatedAt: now,
        };

        if (existing) {
            await ctx.db.patch(existing._id, profile);
            return { success: true, userId: existing._id, isNewUser: false };
        }

        const userId = await ctx.db.insert('users', {
            clerkId,
            ...profile,
            createdAt: now,
            level: 'Intermediate (B1)',
            voice: 'en-US',
            sessionMinutes: 10,
            saveTranscripts: true,
        });
        return { success: true, userId, isNewUser: true };
    },
});

export const me = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return findUser(ctx, identity.subject);
    },
});

export const updateSettings = mutation({
    args: {
        level: v.optional(v.string()),
        voice: v.optional(v.string()),
        sessionMinutes: v.optional(v.float64()),
        saveTranscripts: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('User is not authenticated');
        const user = await findUser(ctx, identity.subject);
        if (!user) throw new Error('User profile not found yet');

        const patch = { updatedAt: Date.now() };
        for (const key of ['level', 'voice', 'sessionMinutes', 'saveTranscripts']) {
            if (args[key] !== undefined) patch[key] = args[key];
        }
        await ctx.db.patch(user._id, patch);
        return { success: true };
    },
});