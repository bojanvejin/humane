"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timestamp = exports.FieldValue = exports.db = void 0;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
Object.defineProperty(exports, "FieldValue", { enumerable: true, get: function () { return firestore_1.FieldValue; } });
Object.defineProperty(exports, "Timestamp", { enumerable: true, get: function () { return firestore_1.Timestamp; } });
const app = (0, app_1.getApps)().length ? (0, app_1.getApps)()[0] : (0, app_1.initializeApp)();
exports.db = (0, firestore_1.getFirestore)(app);
