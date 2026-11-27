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
        // profile settings
        level: v.optional(v.string()),
        voice: v.optional(v.string()), // 'en-US' | 'en-GB'
        sessionMinutes: v.optional(v.float64()),
        saveTranscripts: v.optional(v.boolean()),
    }).index('by_clerk_id', ['clerkId']),

    sessions: defineTable({
        clerkId: v.string(),
        topic: v.string(),
        status: v.union(v.literal('active'), v.literal('completed')),
        startedAt: v.float64(),
        endedAt: v.optional(v.float64()),
        durationSec: v.optional(v.float64()),
        turnCount: v.float64(), // number of things the learner said
        overallScore: v.optional(v.float64()),
        grammarScore: v.optional(v.float64()),
        vocabularyScore: v.optional(v.float64()),
        fluencyScore: v.optional(v.float64()),
        sentenceScore: v.optional(v.float64()),
        pronunciationScore: v.optional(v.float64()),
        feedback: v.optional(v.string()),
        focusArea: v.optional(v.string()),
        notes: v.optional(
            v.object({
                grammar: v.string(),
                vocabulary: v.string(),
                fluency: v.string(),
                sentence: v.string(),
                pronunciation: v.string(),
            })
        ),
        newWords: v.optional(v.array(v.string())),
    }).index('by_clerk', ['clerkId', 'startedAt']),

    transcripts: defineTable({
        sessionId: v.id('sessions'),
        clerkId: v.string(),
        role: v.union(v.literal('user'), v.literal('ai')),
        text: v.string(),
        confidence: v.optional(v.float64()),
        createdAt: v.float64(),
    }).index('by_session', ['sessionId']),

    corrections: defineTable({
        sessionId: v.id('sessions'),
        clerkId: v.string(),
        original: v.string(),
        corrected: v.string(),
        category: v.string(),
        explanation: v.string(),
        createdAt: v.float64(),
    })
        .index('by_session', ['sessionId'])
        .index('by_clerk', ['clerkId', 'createdAt']),

    vocabulary: defineTable({
        clerkId: v.string(),
        word: v.string(),
        sessionId: v.optional(v.id('sessions')),
        createdAt: v.float64(),
    }).index('by_clerk_word', ['clerkId', 'word']),
});