import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation, query } from './_generated/server';

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

async function completedSessions(ctx, clerkId, order) {
    const all = await ctx.db
        .query('sessions')
        .withIndex('by_clerk', (q) => q.eq('clerkId', clerkId))
        .order(order)
        .take(1000);
    return all.filter((s) => s.status === 'completed');
}
// "Deleting" a session only hides its card. Scores, progress, corrections and words stay.
// Only the saved chat messages are removed.
async function hideSession(ctx, sessionId) {
    const msgs = await ctx.db
        .query('transcripts')
        .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
        .collect();
    for (const m of msgs) await ctx.db.delete(m._id);

    await ctx.db.patch(sessionId, { hidden: true });
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

        const savedCategories = [];
        const corrections = Array.isArray(result?.corrections) ? result.corrections : [];
        for (const c of corrections.slice(0, 12)) {
            const original = text(c?.original, 300);
            const corrected = text(c?.corrected, 300);
            if (!original || !corrected || original === corrected) continue;
            const category = text(c?.category, 40) || 'Other';
            await ctx.db.insert('corrections', {
                sessionId,
                clerkId,
                original,
                corrected,
                category,
                explanation: text(c?.explanation, 160),
                createdAt: Date.now(),
            });
            savedCategories.push(category);
        }

        // Progress summary: stays even if the user deletes sessions later.
        const profileUser = await userByClerk(ctx, clerkId);
        if (profileUser) {
            const old = profileUser.progress;
            const counts = new Map();
            let firstScore = overall;
            let firstAt = Date.now();
            let sessionsDone = 1;

            if (old) {
                for (const w of old.weakAreas) counts.set(w.category, w.count);
                for (const cat of savedCategories) counts.set(cat, (counts.get(cat) ?? 0) + 1);
                firstScore = old.firstScore;
                firstAt = old.firstAt;
                sessionsDone = old.sessionsDone + 1;
            } else {
                // Existing users: build the summary from what is already saved.
                const done = await completedSessions(ctx, clerkId, 'asc');
                const allCorrections = await ctx.db
                    .query('corrections')
                    .withIndex('by_clerk', (q) => q.eq('clerkId', clerkId))
                    .collect();
                for (const c of allCorrections) {
                    counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
                }
                if (done[0]) {
                    firstScore = done[0].overallScore ?? overall;
                    firstAt = done[0].startedAt;
                }
                sessionsDone = Math.max(1, done.length);
            }

            const weakAreas = [...counts.entries()]
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            await ctx.db.patch(profileUser._id, {
                progress: { firstScore, firstAt, latestScore: overall, sessionsDone, weakAreas },
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


    },
});

/* ------------------------------------------------------------------ */
/* Public queries (used by the screens)                                */
/* ------------------------------------------------------------------ */

export const listRecent = query({
    args: { limit: v.number() },
    handler: async (ctx, { limit }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const done = await completedSessions(ctx, identity.subject, 'desc');
        return done
            .map((s, i) => ({ s, older: done[i + 1] }))
            .filter(({ s }) => !s.hidden)
            .slice(0, limit)
            .map(({ s, older }) => ({
                _id: s._id,
                topic: s.topic,
                startedAt: s.startedAt,
                durationSec: s.durationSec ?? 0,
                score: s.overallScore ?? 0,
                delta: older ? (s.overallScore ?? 0) - (older.overallScore ?? 0) : null,
            }));
    },
});
export const ensureProgress = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const clerkId = identity.subject;

        const user = await userByClerk(ctx, clerkId);
        if (!user || user.progress) return null; // already saved, never overwrite

        const done = await completedSessions(ctx, clerkId, 'asc'); // includes hidden
        if (done.length === 0) return null;

        const corrections = await ctx.db
            .query('corrections')
            .withIndex('by_clerk', (q) => q.eq('clerkId', clerkId))
            .collect();
        const counts = new Map();
        for (const c of corrections) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
        const weakAreas = [...counts.entries()]
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        await ctx.db.patch(user._id, {
            progress: {
                firstScore: done[0].overallScore ?? 0,
                firstAt: done[0].startedAt,
                latestScore: done[done.length - 1].overallScore ?? 0,
                sessionsDone: done.length,
                weakAreas,
            },
        });
        return null;
    },
});
export const overview = query({
    args: { days: v.number() },
    handler: async (ctx, { days }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        const clerkId = identity.subject;
        const now = Date.now();

        const done = await completedSessions(ctx, clerkId, 'asc'); // includes hidden
        const visible = done.filter((s) => !s.hidden);
        const user = await userByClerk(ctx, clerkId);
        const progress = user?.progress;

        // First day: saved permanently in progress, so deleting never changes it.
        const firstSession = done[0];
        const first = progress
            ? { score: progress.firstScore, at: progress.firstAt }
            : firstSession
                ? { score: firstSession.overallScore ?? 0, at: firstSession.startedAt }
                : null;

        // Latest: the last session still shown on screen.
        const lastVisible = visible[visible.length - 1];
        const latest = lastVisible
            ? { score: lastVisible.overallScore ?? 0, at: lastVisible.startedAt }
            : progress
                ? { score: progress.latestScore, at: progress.firstAt }
                : null;

        const vocab = await ctx.db
            .query('vocabulary')
            .withIndex('by_clerk_word', (q) => q.eq('clerkId', clerkId))
            .collect();

        const since = now - days * DAY;
        const series = visible
            .filter((s) => s.startedAt >= since)
            .map((s) => ({ at: s.startedAt, score: s.overallScore ?? 0 }));

        // Common mistakes: first 7 days since the first session vs the last 7 days.
        const mistakes = [];
        if (first) {
            const corrections = await ctx.db
                .query('corrections')
                .withIndex('by_clerk', (q) => q.eq('clerkId', clerkId))
                .collect();
            const firstEnd = first.at + 7 * DAY;
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
            first,
            latest,
            delta: first && latest ? latest.score - first.score : null,
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

/* ------------------------------------------------------------------ */
/* Delete sessions (used by the All sessions screen)                   */
/* ------------------------------------------------------------------ */

export const deleteSession = mutation({
    args: { sessionId: v.id('sessions') },
    handler: async (ctx, { sessionId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('User is not authenticated');

        const session = await ctx.db.get(sessionId);
        if (!session || session.clerkId !== identity.subject) {
            throw new Error('Session not found');
        }
        await hideSession(ctx, sessionId);
        return { success: true };
    },
});

export const deleteSessions = mutation({
    args: { sessionIds: v.array(v.id('sessions')) },
    handler: async (ctx, { sessionIds }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('User is not authenticated');

        let deleted = 0;
        for (const sessionId of sessionIds) {
            const session = await ctx.db.get(sessionId);
            if (!session || session.clerkId !== identity.subject) continue;
            await hideSession(ctx, sessionId);
            deleted += 1;
        }
        return { deleted };
    },
});