import { v } from 'convex/values';
import { action } from './_generated/server';
import { internal } from './_generated/api';

// Free-tier model. Change it any time with:
//   npx convex env set GEMINI_MODEL <model-id>
// Optional: use a stronger model only for the end-of-session scoring:
//   npx convex env set GEMINI_ANALYSIS_MODEL <model-id>
const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

const CATEGORIES = [
    'Past tense',
    'Articles (a / the)',
    'Prepositions',
    'Word choice',
    'Sentence structure',
    'Subject-verb agreement',
    'Pronunciation',
    'Other',
];

const DAY = 24 * 60 * 60 * 1000;

const NO_HISTORY =
    'Learner history: no finished session yet, so there is no score and no start date. Never invent any.';

// Builds the learner history text that is given to the AI partner.
// It includes when the learner started, first score, latest score and the improvement.
const historyLine = (user) => {
    const p = user?.progress;
    if (!p) return NO_HISTORY;

    const weak = (p.weakAreas ?? [])
        .filter((w) => w.category !== 'Other')
        .slice(0, 3)
        .map((w) => w.category)
        .join(', ');

    const days = Math.floor((Date.now() - p.firstAt) / DAY);
    const startedAgo = days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
    const startDate = new Date(p.firstAt).toDateString();

    let change = 'Only one session so far, so improvement cannot be measured yet.';
    if (p.sessionsDone >= 2) {
        const diff = p.latestScore - p.firstScore;
        change =
            diff > 0
                ? `Improvement: +${diff} points since the first session.`
                : diff < 0
                    ? `Score is ${Math.abs(diff)} points lower than the first session.`
                    : 'Score is the same as the first session.';
    }

    return [
        `Learner history: started ${startedAgo} (${startDate}).`,
        `First score: ${p.firstScore}/100. Latest score: ${p.latestScore}/100. Sessions done: ${p.sessionsDone}.`,
        change,
        weak ? `Most common mistakes: ${weak}.` : '',
    ]
        .filter(Boolean)
        .join(' ');
};

/* ---------------------------- helpers ---------------------------- */

const requireClerkId = async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error('Not authenticated');

    return identity.subject;
};

const callGemini = async ({ model, system, contents, json = false, maxOutputTokens = 180 }) => {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    const models = [
        model,
        process.env.GEMINI_BACKUP_MODEL_1 || 'gemini-3.5-flash-lite',
        process.env.GEMINI_BACKUP_MODEL_2 || 'gemini-3.8-flash',
    ].filter((value, index, array) => value && array.indexOf(value) === index);

    let lastError;

    for (const currentModel of models) {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': key,
                    },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: system }],
                        },
                        contents,
                        generationConfig: {
                            maxOutputTokens,
                            ...(json ? { responseMimeType: 'application/json' } : {}),
                        },
                    }),
                }
            );

            if (!res.ok) {
                const body = await res.text();
                lastError = new Error(`${currentModel} (${res.status}): ${body.slice(0, 200)}`);

                // Try another model for unavailable, overloaded,
                // rate-limited, or server-error responses.
                if ([404, 408, 429, 500, 502, 503, 504].includes(res.status)) {
                    continue;
                }

                throw lastError;
            }

            const data = await res.json();

            const out = (data.candidates?.[0]?.content?.parts ?? [])
                .map((part) => part.text ?? '')
                .join('')
                .trim();

            if (!out) {
                lastError = new Error(`${currentModel} returned an empty answer`);
                continue;
            }

            return out;
        } catch (error) {
            lastError = error;

            // Network errors also move to the next model.
            if (error instanceof TypeError) {
                continue;
            }

            // Do not retry authentication or invalid-request errors.
            throw error;
        }
    }

    throw new Error(`All Gemini models failed. ${lastError?.message || 'Unknown error'}`);
};

// Converts Gemini's JSON response into a JavaScript object.
const parseJson = (raw) => {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
        throw new Error('Could not read the analysis from Gemini');
    }
};

const partnerSystem = ({ name, level, topic, history }) => {
    return [
        'You are a warm, patient English speaking coach inside the SpeakTrack app.',
        `The learner is ${name}. Their level is ${level}. Today's topic: "${topic}".`,
        history || NO_HISTORY,
        '',
        'Every learner message comes from speech-to-text. IGNORE capitalization, punctuation and spelling. Some words may be misheard: guess the meaning from context and do not treat those as mistakes.',
        '',
        'STEP 1 - Decide the type of message:',
        'A) The learner asks YOU a question (about their progress, score, start date, level, or anything else).',
        'B) The learner just talks or answers your question.',
        '',
        'If the message is type A, ALWAYS do both parts, in this order:',
        '1. Correction: only if they made a real mistake, say ONE short line like "You can ask: ..." (vary the opening). If there is no real mistake, or they said "do not correct", skip this part.',
        '2. Answer: ALWAYS answer the question completely in 2 to 4 short sentences. Never skip the answer. Never replace the answer with a follow-up question or with praise.',
        'Then end with ONE short follow-up question (maximum 12 words).',
        '',
        'If the message is type B:',
        '- If there is a real mistake, give the corrected version (vary the opening: "Nice try! You can say: ...", "Almost! A better way is: ...", "Small fix: ..."). Never use the same opening twice in a row. Keep it light for tiny mistakes.',
        '- If there is no mistake, praise in a few words and ask ONE simple follow-up question (maximum 12 words).',
        '',
        'PROGRESS QUESTIONS (when started, score, improvement, level):',
        '- Use ONLY the learner history above. Say when they started, their first score, their latest score and the improvement.',
        '- If the history says there is no finished session yet, say clearly that they started today, that the score will appear after they finish this session, and encourage them. Do NOT invent dates, topics, scores or weeks.',
        '- Mention one area to practice only if the history lists one.',
        '',
        'Other rules:',
        '- Adapt to the learner level. For Beginner (A2): very simple words, very short sentences, easy questions. For Intermediate (B1): everyday words and normal questions. For Upper-intermediate (B2): richer vocabulary and opinion questions. For Advanced (C1): natural, idiomatic English and deeper questions. Corrections should match the level too: do not correct small style choices for beginners, but be stricter for advanced learners.',
        '- Do not explain grammar rules.',
        '- Use the history quietly otherwise. Do not read out scores unless asked.',
        '- Plain spoken English only: no markdown, no emojis, no lists, no stage directions.',
        '- If the message is really unclear, kindly ask them to say it again.',
    ].join('\n');
};

function openingText({ name, topic }) {
    return `[Session start] Greet ${name} in one short sentence, then ask your first question about "${topic}".`;
}

function toContents(opening, messages) {
    const contents = [{ role: 'user', parts: [{ text: opening }] }];
    for (const m of messages.slice(-6)) {
        const role = m.role === 'ai' ? 'model' : 'user';
        const last = contents[contents.length - 1];
        if (last.role === role) last.parts[0].text += `\n${m.text}`;
        else contents.push({ role, parts: [{ text: m.text }] });
    }
    return contents;
}

const firstName = (user) => (user?.name || 'there').split(' ')[0];

/* ---------------------------- actions ---------------------------- */

export const startSession = action({
    args: { topic: v.string() },
    handler: async (ctx, { topic }) => {
        const clerkId = await requireClerkId(ctx);
        const user = await ctx.runQuery(internal.sessions.getUser, { clerkId });
        const name = firstName(user);
        const level = user?.level || 'Intermediate (B1)';

        const sessionId = await ctx.runMutation(internal.sessions.create, { clerkId, topic });

        const reply = await callGemini({
            model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
            system: partnerSystem({ name, level, topic, history: historyLine(user) }),
            contents: [{ role: 'user', parts: [{ text: openingText({ name, topic }) }] }],
            maxOutputTokens: 500,
        });

        await ctx.runMutation(internal.sessions.addMessage, { sessionId, clerkId, role: 'ai', text: reply });
        return { sessionId, reply };
    },
});

// Saves what the learner said (if `text` is given), then asks Gemini for the reply.
// Call it without `text` to retry a reply that failed.
export const respond = action({
    args: {
        sessionId: v.id('sessions'),
        text: v.optional(v.string()),
        confidence: v.optional(v.float64()),
    },
    handler: async (ctx, { sessionId, text, confidence }) => {
        const clerkId = await requireClerkId(ctx);

        if (text && text.trim()) {
            await ctx.runMutation(internal.sessions.addMessage, {
                sessionId,
                clerkId,
                role: 'user',
                text: text.trim(),
                ...(confidence ? { confidence } : {}),
            });
        }

        const { session, messages, user } = await ctx.runQuery(internal.sessions.getContext, {
            sessionId,
            clerkId,
        });

        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'ai') return { reply: lastMessage.text }; // already answered

        const name = firstName(user);
        const reply = await callGemini({
            model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
            system: partnerSystem({
                name,
                level: user?.level || 'Intermediate (B1)',
                topic: session.topic,
                history: historyLine(user),
            }),
            contents: toContents(openingText({ name, topic: session.topic }), messages),
            maxOutputTokens: 1500,
        });

        await ctx.runMutation(internal.sessions.addMessage, { sessionId, clerkId, role: 'ai', text: reply });
        return { reply };
    },
});

export const finishSession = action({
    args: { sessionId: v.id('sessions'), durationSec: v.float64() },
    handler: async (ctx, { sessionId, durationSec }) => {
        const clerkId = await requireClerkId(ctx);
        const { session, messages, user } = await ctx.runQuery(internal.sessions.getContext, {
            sessionId,
            clerkId,
        });

        const learnerTurns = messages.filter((m) => m.role === 'user');
        if (learnerTurns.length === 0) {
            await ctx.runMutation(internal.sessions.discard, { sessionId, clerkId });
            return { discarded: true };
        }

        const confidences = learnerTurns.map((m) => m.confidence).filter((c) => typeof c === 'number' && c > 0);
        const avgConfidence = confidences.length
            ? (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(2)
            : 'unknown';

        const transcript = messages
            .map((m) =>
                m.role === 'ai'
                    ? `Partner: ${m.text}`
                    : `Learner: ${m.text}${m.confidence ? ` [recognizer_confidence=${m.confidence.toFixed(2)}]` : ''}`
            )
            .join('\n');

        const system = [
            'You are an expert, fair English speaking examiner. You assess a learner from a speech-to-text transcript.',
            'The transcript was produced by an automatic speech recognizer: IGNORE capitalization and punctuation, never penalize them.',
            'You cannot hear audio. Estimate pronunciation from the recognizer confidence values (low confidence on a word or turn suggests unclear pronunciation) and from words that look misheard. Say it is an estimate in the pronunciation note.',
            'Judge fluency from answer length, filler words (um, uh), repetition, restarts and self-corrections.',
            'Be honest and calibrated. Typical learners score 45-85. With fewer than 3 learner turns, stay conservative and mention the short sample in the feedback.',
            'Be encouraging but specific. Only list real mistakes the learner actually made, quoting their exact words.',
        ].join('\n');

        const prompt = [
            `Learner level: ${user?.level || 'Intermediate (B1)'}. Topic: "${session.topic}".`,
            `Average recognizer confidence: ${avgConfidence}.`,
            '',
            'TRANSCRIPT:',
            transcript,
            '',
            'Return ONLY one JSON object, no markdown, with exactly this shape:',
            '{',
            '  "scores": { "grammar": 0-100, "vocabulary": 0-100, "fluency": 0-100, "sentence": 0-100, "pronunciation": 0-100 },',
            '  "notes": { "grammar": "max 8 words", "vocabulary": "max 8 words", "fluency": "max 8 words", "sentence": "max 8 words", "pronunciation": "max 8 words" },',
            '  "feedback": "2-3 encouraging sentences that name the main focus area",',
            '  "focusArea": "a short phrase copied exactly from the feedback text, e.g. past tense in stories",',
            `  "corrections": [ { "original": "exact learner words", "corrected": "fixed version", "category": "one of: ${CATEGORIES.join(' | ')}", "explanation": "max 15 words" } ],`,
            '  "newWords": ["up to 6 useful words or phrases the learner should remember"]',
            '}',
            'Include at most 8 corrections, most important first. Use an empty array if there are no mistakes.',
        ].join('\n');

        const raw = await callGemini({
            model: process.env.GEMINI_ANALYSIS_MODEL || process.env.GEMINI_MODEL || DEFAULT_MODEL,
            system,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            json: true,
            maxOutputTokens: 4096,
        });

        const result = parseJson(raw);
        await ctx.runMutation(internal.sessions.saveResult, { sessionId, clerkId, durationSec, result });
        return { discarded: false };
    },
});