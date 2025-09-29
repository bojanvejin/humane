"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.materializeRaw = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const reportPlayBatch_1 = require("./reportPlayBatch");
exports.materializeRaw = (0, firestore_1.onDocumentCreated)("plays_raw/{yyyymm}/events/{eventId}", async (event) => {
    var _a;
    // Get services from the default initialized app
    const app = admin.app();
    const db = app.firestore();
    const rawPlay = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    const eventId = event.params.eventId;
    const yyyymm = event.params.yyyymm;
    if (!rawPlay) {
        console.error(`No data found for event ${eventId} in plays_raw/${yyyymm}/events.`);
        return null;
    }
    // Prevent re-processing if already marked as processed (e.g., by another instance)
    if (rawPlay.processed) {
        console.log(`Raw play ${eventId} already processed. Skipping.`);
        return null;
    }
    try {
        // Fetch actual track duration from Firestore
        const trackDoc = await db.collection('tracks').doc(rawPlay.trackId).get();
        if (!trackDoc.exists) {
            console.warn(`Track ${rawPlay.trackId} not found for raw play ${eventId}. Marking as suspicious.`);
            await db.collection('plays_raw').doc(yyyymm).collection('events').doc(eventId).update({
                suspicious: true,
                fraudReasons: admin.firestore.FieldValue.arrayUnion('track_not_found'),
                fraudScore: 1,
                processed: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return null;
        }
        const track = trackDoc.data();
        const trackFullDurationMs = track.duration * 1000; // Convert seconds to milliseconds
        // Re-evaluate suspicious status with actual track duration and hashed IP
        const { isSuspicious: reEvaluatedSuspicious, reasons: reEvaluatedReasons, fraudScore: reEvaluatedFraudScore } = (0, reportPlayBatch_1.detectSuspiciousPlay)({
            duration: rawPlay.duration,
            trackFullDurationMs: trackFullDurationMs,
            deviceInfo: rawPlay.deviceInfo, // deviceInfo already contains hashed IP from reportPlayBatch
        });
        let finalSuspicious = rawPlay.suspicious || reEvaluatedSuspicious;
        let finalFraudReasons = Array.from(new Set([...(rawPlay.fraudReasons || []), ...reEvaluatedReasons]));
        let finalFraudScore = Math.max(rawPlay.fraudScore || 0, reEvaluatedFraudScore);
        // Deduplication using UserTrackAggregate
        const userTrackAggRef = db.collection('userTrackAgg').doc(`${rawPlay.userId}_${rawPlay.trackId}`);
        const userTrackAggDoc = await userTrackAggRef.get();
        const currentPlayTimestamp = new Date(rawPlay.timestamp);
        if (userTrackAggDoc.exists) {
            const aggData = userTrackAggDoc.data();
            // Rule: Dedupe same track repeats within max(30s, duration/4)
            const dedupeWindowMs = Math.max(30000, trackFullDurationMs / 4);
            const windowEndsAt = aggData.windowEndsAt.toDate();
            if (currentPlayTimestamp.getTime() < windowEndsAt.getTime()) {
                console.log(`Raw play ${eventId} is a duplicate within dedupe window. Marking as suspicious.`);
                finalSuspicious = true;
                finalFraudReasons.push('duplicate_play_within_window');
                finalFraudScore = Math.max(finalFraudScore, 1);
            }
        }
        // Materialize the play
        const materializedPlay = {
            id: eventId, // Use eventId as the materialized play ID
            trackId: rawPlay.trackId,
            userId: rawPlay.userId,
            sessionId: rawPlay.sessionId,
            duration: rawPlay.duration / 1000, // Store in seconds as per Play interface
            completed: rawPlay.duration >= (trackFullDurationMs * 0.85), // 85% completion
            suspicious: finalSuspicious,
            fraudReasons: finalFraudReasons.length > 0 ? finalFraudReasons : undefined,
            fraudScore: finalFraudScore,
            deviceInfo: rawPlay.deviceInfo,
            timestamp: currentPlayTimestamp,
        };
        // Use a transaction to ensure atomicity for userTrackAgg update and play write
        await db.runTransaction(async (transaction) => {
            transaction.set(db.collection('plays').doc(eventId), materializedPlay);
            // Update or create userTrackAgg
            const newWindowEndsAt = new Date(currentPlayTimestamp.getTime() + Math.max(30000, trackFullDurationMs / 4));
            transaction.set(userTrackAggRef, {
                userId: rawPlay.userId,
                trackId: rawPlay.trackId,
                lastPlayAt: admin.firestore.Timestamp.fromDate(currentPlayTimestamp),
                windowEndsAt: admin.firestore.Timestamp.fromDate(newWindowEndsAt),
                playCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true }); // Use merge:true to update existing fields or create if not exists
        });
        // Mark raw play as processed
        await db.collection('plays_raw').doc(yyyymm).collection('events').doc(eventId).update({
            processed: true,
            suspicious: finalSuspicious,
            fraudReasons: finalFraudReasons.length > 0 ? finalFraudReasons : admin.firestore.FieldValue.delete(),
            fraudScore: finalFraudScore,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Materialized play ${eventId} successfully.`);
        return null;
    }
    catch (error) {
        console.error(`Error materializing raw play ${eventId}:`, error);
        // Mark raw play as processed but failed, to avoid re-triggering
        await db.collection('plays_raw').doc(yyyymm).collection('events').doc(eventId).update({
            processed: true,
            materializationError: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
    }
});
//# sourceMappingURL=materializeRaw.js.map