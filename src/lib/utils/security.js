"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashIpAddress = hashIpAddress;
exports.generateUuid = generateUuid;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Hashes an IP address using SHA-256 with a salt.
 * @param ipAddress The IP address to hash.
 * @param salt A secret salt to make the hash more secure.
 * @returns A SHA-256 hashed string of the IP address.
 */
function hashIpAddress(ipAddress, salt) {
    return crypto_1.default.createHmac('sha256', salt)
        .update(ipAddress)
        .digest('hex');
}
/**
 * Generates a UUID (Universally Unique Identifier).
 * @returns A UUID string.
 */
function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
