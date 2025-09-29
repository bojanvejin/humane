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
exports.scheduledUCPSCalculation = exports.processTrackUpload = exports.createStripeConnectAccount = exports.handleStripeWebhook = exports.calculateUCPSPayouts = exports.materializeRaw = exports.reportPlayBatch = void 0;
const admin = __importStar(require("firebase-admin"));
const reportPlayBatch_1 = require("./plays/reportPlayBatch");
Object.defineProperty(exports, "reportPlayBatch", { enumerable: true, get: function () { return reportPlayBatch_1.reportPlayBatch; } });
const materializeRaw_1 = require("./plays/materializeRaw");
Object.defineProperty(exports, "materializeRaw", { enumerable: true, get: function () { return materializeRaw_1.materializeRaw; } });
const calculateUCPSPayouts_1 = require("./payouts/calculateUCPSPayouts");
Object.defineProperty(exports, "calculateUCPSPayouts", { enumerable: true, get: function () { return calculateUCPSPayouts_1.calculateUCPSPayouts; } });
const webhooks_1 = require("./stripe/webhooks");
Object.defineProperty(exports, "handleStripeWebhook", { enumerable: true, get: function () { return webhooks_1.handleStripeWebhook; } });
const connect_1 = require("./stripe/connect");
Object.defineProperty(exports, "createStripeConnectAccount", { enumerable: true, get: function () { return connect_1.createStripeConnectAccount; } });
const processTrackUpload_1 = require("./tracks/processTrackUpload");
Object.defineProperty(exports, "processTrackUpload", { enumerable: true, get: function () { return processTrackUpload_1.processTrackUpload; } });
const scheduler_1 = require("firebase-functions/v2/scheduler"); // Import onSchedule from v2
admin.initializeApp();
// Import calculateUCPSPayouts for use within this file
const calculateUCPSPayouts_2 = require("./payouts/calculateUCPSPayouts");
// Scheduled functions (v2)
exports.scheduledUCPSCalculation = (0, scheduler_1.onSchedule)('0 0 * * *', async (event) => {
    console.log('Running scheduled UCPS calculation (v2).');
    await (0, calculateUCPSPayouts_2.calculateUCPSPayouts)(); // Call the placeholder function
});