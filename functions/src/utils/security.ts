import crypto from 'crypto';

/**
 * Hashes an IP address using SHA-256 with a salt.
 * @param ipAddress The IP address to hash.
 * @param salt A secret salt to make the hash more secure.
 * @returns A SHA-256 hashed string of the IP address.
 */
export function hashIpAddress(ipAddress: string, salt: string): string {
  return crypto.createHmac('sha256', salt)
               .update(ipAddress)
               .digest('hex');
}

/**
 * Generates a UUID (Universally Unique Identifier).
 * @returns A UUID string.
 */
export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}