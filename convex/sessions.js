import { v } from 'convex/values';
import { internalMutation, internalQuery, query } from './_generated/server';

const DAY = 24 * 60 * 60 * 1000;

const clamp = (x) => Math.max(0, Math.min(100, Math.round(Number(x) || 0)));
const text = (x, max) => String(x ?? '').trim().slice(0, max);

async function userByClerk(ctx, clerkId) {
    return ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
        .unique();
}

async function ownedSession(ctx, sessionId, clerkId) {
    const session = await ctx.db.get(sessionId);
    if (!session || session.clerkId !== clerkId) throw new Error('Session not found');
    return session;
}

/* ------------------------------------------------------------------ */
/* Internal functions (called only from convex/ai.js)                  */
/* ------------------------------------------------------------------ */

export const getUser = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, { clerkId }) => userByClerk(ctx, clerkId),
});

export const create = internalMutation({
    args: { clerkId: v.string(), topic: v.string() },
    handler: async (ctx, { clerkId, topic }) =>
        ctx.db.insert('sessions', {
            clerkId,
            topic,
            status: 'active',
            startedAt: Date.now(),
            turnCount: 0,
        }),
});

export const addMessage = internalMutation({
    args: {
        sessionId: v.id('sessions'),
        clerkId: v.string(),
        role: v.union(v.literal('user'), v.literal('ai')),
        text: v.string(),
        confidence: v.optional(v.float64()),
    },
    handler: async (ctx, args) => {
        const session = await ownedSession(ctx, args.sessionId, args.clerkId);
        await ctx.db.insert('transcripts', {
            sessionId: args.sessionId,
            clerkId: args.clerkId,
            role: args.role,
            text: args.text,
            ...(args.confidence !== undefined ? { confidence: args.confidence } : {}),
            createdAt: Date.now(),
        });
        if (args.role === 'user') {
            await ctx.db.patch(args.sessionId, { turnCount: session.turnCount + 1 });
        }
    },
});

export const getContext = internalQuery({
    args: { sessionId: v.id('sessions'), clerkId: v.string() },
    handler: async (ctx, { sessionId, clerkId }) => {
        const session = await ownedSession(ctx, sessionId, clerkId);
        const messages = await ctx.db
            .query('transcripts')
            .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
            .collect();
        const user = await userByClerk(ctx, clerkId);
        return { session, messages, user };
    },
});

export const discard = internalMutation({
    args: { sessionId: v.id('sessions'), clerkId: v.string() },
    handler: async (ctx, { sessionId, clerkId }) => {
        await ownedSession(ctx, sessionId, clerkId);
        const msgs = await ctx.db
            .query('transcripts')
            .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
            .collect();
        for (const m of msgs) await ctx.db.delete(m._id);
        await ctx.db.delete(sessionId);
    },
});

export const saveResult = internalMutation({
    args: {
        sessionId: v.id('sessions'),
        clerkId: v.string(),
        durationSec: v.float64(),
        result: v.any(),
    },
    handler: async (ctx, { sessionId, clerkId, durationSec, result }) => {
        await ownedSession(ctx, sessionId, clerkId);
        const s = result?.scores ?? {};
        const n = result?.notes ?? {};

        const grammar = clamp(s.grammar);
        const vocabulary = clamp(s.vocabulary);
        const fluency = clamp(s.fluency);
        const sentence = clamp(s.sentence);
        const pronunciation = clamp(s.pronunciation);
        const overall = Math.round(
            grammar * 0.25 +
            vocabulary * 0.2 +
            fluency * 0.2 +
            sentence * 0.15 +
            pronunciation * 0.2
        );

        const words = (Array.isArray(result?.newWords) ? result.newWords : [])
            .map((w) => text(w, 40))
            .filter(Boolean)
            .slice(0, 6);

        await ctx.db.patch(sessionId, {
            status: 'completed',
            endedAt: Date.now(),
            durationSec: Math.max(1, Math.round(durationSec)),
            overallScore: overall,
            grammarScore: grammar,
            vocabularyScore: vocabulary,
            fluencyScore: fluency,
            sentenceScore: sentence,
            pronunciationScore: pronunciation,
            feedback: text(result?.feedback, 600),
            focusArea: text(result?.focusArea, 80),
            notes: {
                grammar: text(n.grammar, 120),
                vocabulary: text(n.vocabulary, 120),
                fluency: text(n.fluency, 120),
                sentence: text(n.sentence, 120),
                pronunciation: text(n.pronunciation, 120),
            },
            newWords: words,
        });

        const corrections = Array.isArray(result?.corrections) ? result.corrections : [];
        for (const c of corrections.slice(0, 12)) {
            const original = text(c?.original, 300);
            const corrected = text(c?.corrected, 300);
            if (!original || !corrected || original === corrected) continue;
            await ctx.db.insert('corrections', {
                sessionId,
                clerkId,
                original,
                corrected,
                category: text(c?.category, 40) || 'Other',
                explanation: text(c?.explanation, 160),
                createdAt: Date.now(),
            });
        }

        for (const word of words) {
            const key = word.toLowerCase();
            const exists = await ctx.db
                .query('vocabulary')
                .withIndex('by_clerk_word', (q) => q.eq('clerkId', clerkId).eq('word', key))
                .first();
            if (!exists) {
                await ctx.db.insert('vocabulary', { clerkId, word: key, sessionId, createdAt: Date.now() });
            }
        }

        // Respect the "Save transcripts" setting: keep scores and corrections, drop the raw chat.
        const user = await userByClerk(ctx, clerkId);
        if (user?.saveTranscripts === false) {
            const msgs = await ctx.db
                .query('transcripts')
                .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
                .collect();
            for (const m of msgs) await ctx.db.delete(m._id);
        }
    },
});

/* ------------------------------------------------------------------ */
/* Public queries (used by the screens)                                */
/* ------------------------------------------------------------------ */

async function completedSessions(ctx, clerkId, order) {
    const all = await ctx.db
        .query('sessions')
        .withIndex('by_clerk', (q) => q.eq('clerkId', clerkId))
        .order(order)
        .take(1000);
    return all.filter((s) => s.status === 'completed');
}

export const listRecent = query({
    args: { limit: v.number() },
    handler: async (ctx, { limit }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const done = await completedSessions(ctx, identity.subject, 'desc');
        return done.slice(0, limit).map((s, i) => {
            const older = done[i + 1];
            return {
                _id: s._id,
                topic: s.topic,
                startedAt: s.startedAt,
                durationSec: s.durationSec ?? 0,
                score: s.overallScore ?? 0,
                delta: older ? (s.overallScore ?? 0) - (older.overallScore ?? 0) : null,
            };
        });
    },
});

export const overview = query({
    args: { days: v.number() },
    handler: async (ctx, { days }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const clerkId = identity.subject;
        const now = Date.now();

        const done = await completedSessions(ctx, clerkId, 'asc');
        const first = done[0];
        const latest = done[done.length - 1];

        const vocab = await ctx.db
            .query('vocabulary')
            .withIndex('by_clerk_word', (q) => q.eq('clerkId', clerkId))
            .collect();

        const since = now - days * DAY;
        const series = done
            .filter((s) => s.startedAt >= since)
            .map((s) => ({ at: s.startedAt, score: s.overallScore ?? 0 }));

        // Common mistakes: first 7 days since the first session vs the last 7 days.
        const mistakes = [];
        if (first) {
            const corrections = await ctx.db
                .query('corrections')
                .withIndex('by_clerk', (q) => q.eq('clerkId', clerkId))
                .collect();
            const firstEnd = first.startedAt + 7 * DAY;
            const recentStart = now - 7 * DAY;
            const map = new Map();
            for (const c of corrections) {
                const row = map.get(c.category) ?? { category: c.category, first: 0, recent: 0 };
                if (c.createdAt <= firstEnd) row.first += 1;
                if (c.createdAt >= recentStart) row.recent += 1;
                map.set(c.category, row);
            }
            mistakes.push(
                ...[...map.values()]
                    .sort((a, b) => b.first + b.recent - (a.first + a.recent))
                    .slice(0, 5)
            );
        }

        return {
            count: done.length,
            totalSec: done.reduce((sum, s) => sum + (s.durationSec ?? 0), 0),
            newWords: vocab.length,
            first: first ? { score: first.overallScore ?? 0, at: first.startedAt } : null,
            latest: latest ? { score: latest.overallScore ?? 0, at: latest.startedAt } : null,
            delta: first && latest ? (latest.overallScore ?? 0) - (first.overallScore ?? 0) : null,
            series,
            mistakes,
        };
    },
});

export const get = query({
    args: { sessionId: v.id('sessions') },

    handler: async (ctx, { sessionId }) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) return null;

        const session = await ctx.db.get(sessionId);
        if (!session || session.clerkId !== identity.subject) return null;

        const corrections = await ctx.db
            .query('corrections')
            .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
            .collect();

        const earlier = await ctx.db
            .query('sessions')
            .withIndex('by_clerk', (q) =>
                q.eq('clerkId', identity.subject).lt('startedAt', session.startedAt)
            )
            .order('desc')
            .take(10);
        const previous = earlier.find((s) => s.status === 'completed');

        return {
            session,
            corrections,
            delta: previous ? (session.overallScore ?? 0) - (previous.overallScore ?? 0) : null,
        };
    },
});