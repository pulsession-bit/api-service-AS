import crypto from 'crypto';
import { ulid } from 'ulid';

/**
 * Generate SHA-256 hash of PDF buffer
 */
export function hashPDF(pdfBuffer: Buffer): string {
    return crypto.createHash('sha256').update(pdfBuffer).digest('hex');
}

/**
 * Generate public fingerprint (first 8 chars of hash, uppercase)
 */
export function generateFingerprint(hash: string): string {
    return hash.substring(0, 8).toUpperCase();
}

/**
 * Generate ULID for certificate ID
 */
export function generateCertificateId(): string {
    return ulid();
}

/**
 * HMAC for GDPR-compliant privacy (IP/UA hashing)
 * Uses secret pepper from Secret Manager
 */
export function hmacForPrivacy(data: string, pepper: string): string {
    return crypto
        .createHmac('sha256', pepper)
        .update(data)
        .digest('hex');
}

/**
 * Generate secure random pepper (for initial setup)
 */
export function generatePepper(): string {
    return crypto.randomBytes(32).toString('hex');
}
