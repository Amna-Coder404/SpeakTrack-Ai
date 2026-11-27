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

/* ---------------------------- helpers ---------------------------- */

const requireClerkId = async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) throw new Error('Not authenticated');

    return identity.subject;
};


const callGemini = async ({ model, system, contents, json = false, maxOutputTokens = 180, }) => {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
        throw new Error('GEMINI_API_KEY is not set');
    }

    const models = [
        model,
        process.env.GEMINI_BACKUP_MODEL_1 || 'gemini-3.5-flash-lite',
        process.env.GEMINI_BACKUP_MODEL_2 || 'gemini-3.8-flash',
    ].filter((value, index, array) =>
        value && array.indexOf(value) === index
    );

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
                            ...(json
                                ? { responseMimeType: 'application/json' }
                                : {}),
                        },
                    }),
                }
            );

            if (!res.ok) {
                const body = await res.text();
                lastError = new Error(
                    `${currentModel} (${res.status}): ${body.slice(0, 200)}`
                );

                // Try another model for unavailable, overloaded,
                // rate-limited, or server-error responses.
                if (
                    [404, 408, 429, 500, 502, 503, 504].includes(res.status)
                ) {
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

    throw new Error(
        `All Gemini models failed. ${lastError?.message || 'Unknown error'}`
    );
};

// Gemini ke JSON response ko JavaScript object mein convert karta hai.
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
}

const partnerSystem = ({ name, level, topic }) => {
    return [
        'You are a warm, patient English speaking coach inside the SpeakTrack app.',
        `The learner is ${name}. Their level is ${level}. Today's topic: "${topic}".`,
        'Rules:',
        '- The learner message comes from speech-to-text. IGNORE capitalization, punctuation and spelling.',
        '- Some words may be misheard by the recognizer (nonsense words). Guess the intended meaning from context and do NOT treat those as the learner mistakes.',
        '- If the learner made real mistakes: start with You should say: and then give the corrected version of their WHOLE message. Fix ALL real grammar, word choice and sentence mistakes, keep their meaning, and keep it natural. If their message is very long, correct the first 3 or 4 sentences only.',
        '- Do not explain grammar rules.',
        '- After the correction, add ONE short follow-up question (maximum 12 words).',
        '- If there is NO mistake: reply in one short sentence and ask ONE simple follow-up question.',
        '- Plain spoken English only: no markdown, no emojis, no lists, no stage directions.',
        '- If their message is unclear, kindly ask them to say it again.',
    ].join('\n');
};

function openingText({ name, topic }) {
    return `[Session start] Greet ${name} in one short sentence, then ask your first question about "${topic}".`;
};

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
            system: partnerSystem({ name, level, topic }),
            contents: [{ role: 'user', parts: [{ text: openingText({ name, topic }) }] }],
            maxOutputTokens: 250,
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
            system: partnerSystem({ name, level: user?.level || 'Intermediate (B1)', topic: session.topic }),
            contents: toContents(openingText({ name, topic: session.topic }), messages),
            maxOutputTokens: 512,
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