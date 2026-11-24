
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        imageUrl: v.optional(v.string()),
        createdAt: v.float64(),
        updatedAt: v.optional(v.float64()),
    }).index('by_clerk_id', ['clerkId']),

    sessions: defineTable({
        userId: v.id('users'),
        duration: v.number(),
        score: v.optional(v.number()),
        status: v.string(),
        createdAt: v.number(),
    }).index('by_user', ['userId']),

    transcripts: defineTable({
        sessionId: v.id('sessions'),
        role: v.string(),
        text: v.string(),
        createdAt: v.number(),
    }).index('by_session', ['sessionId']),

    corrections: defineTable({
        sessionId: v.id('sessions'),
        originalText: v.string(),
        correctedText: v.string(),
        explanation: v.string(),
    }).index('by_session', ['sessionId']),

    vocabulary: defineTable({
        userId: v.id('users'),
        word: v.string(),
        meaning: v.string(),
        example: v.optional(v.string()),
        createdAt: v.number(),
    }).index('by_user', ['userId']),
});
