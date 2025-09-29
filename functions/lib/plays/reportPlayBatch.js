"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportPlayBatch = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebaseAdmin_1 = require("../firebaseAdmin");
exports.reportPlayBatch = (0, https_1.onRequest)(async (req, res) => {
    // Basic CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    try {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Use POST' });
            return;
        }
        // Support body or rawBody
        const body = (req.body && typeof req.body === 'object')
            ? req.body
            : (req.rawBody ? JSON.parse(req.rawBody.toString('utf8')) : null);
        if (!body || !Array.isArray(body.plays)) {
            res.status(400).json({ error: 'Body must be { plays: [] }' });
            return;
        }
        const batch = firebaseAdmin_1.db.batch();
        for (const [i, play] of body.plays.entries()) {
            if (!play?.trackId) {
                res.status(400).json({ error: `plays[${i}].trackId required` });
                return;
            }
            if (!play?.userId) {
                res.status(400).json({ error: `plays[${i}].userId required` });
                return;
            }
            const ref = firebaseAdmin_1.db.collection('plays').doc();
            batch.set(ref, {
                trackId: String(play.trackId),
                userId: String(play.userId),
                msPlayed: typeof play.msPlayed === 'number' ? play.msPlayed : null,
                createdAt: firebaseAdmin_1.FieldValue.serverTimestamp(),
            });
        }
        await batch.commit();
        res.status(200).json({ status: 'ok', wrote: body.plays.length });
    }
    catch (e) {
        console.error('reportPlayBatch error:', e?.stack || e?.message || e);
        res.status(500).json({ error: 'Internal error', detail: String(e?.message || e) });
    }
});
