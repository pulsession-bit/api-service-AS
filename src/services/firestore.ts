import admin from 'firebase-admin';

// Initialize Firebase Admin (uses ADC in Cloud Run)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIRESTORE_PROJECT_ID || 'deskcompliance-ec7e9',
    });
}

const db = admin.firestore();

export interface Certificate {
    certificate_id: string;
    public_fingerprint: string;
    version: number;
    status: 'valid' | 'revoked';
    issued_at: admin.firestore.Timestamp;
    revoked_at?: admin.firestore.Timestamp;
    revoked_reason?: string;
    lot_id: string;
    issuer_id: string;
    expertise_id?: string;
    data_public: {
        title: string;
        typology: string;
        period: string;
        materials: string;
        dimensions?: string;
        score: number;
        classification: string;
        laboratory: string;
        tests_performed?: string[];
    };
    pdf: {
        r2_key: string;
        sha256: string;
        size: number;
    };
    verification_count: number;
    last_verified_at?: admin.firestore.Timestamp;
    metadata?: {
        ip_address?: string;
        user_agent?: string;
        generation_duration_ms?: number;
    };
}

export interface VerificationLog {
    certificate_id: string;
    ts: admin.firestore.Timestamp;
    ip_hmac: string;
    ua_hmac: string;
    result: 'valid' | 'revoked' | 'not_found';
    route: 'verify' | 'download';
    country?: string;
}

/**
 * Create certificate in Firestore
 */
export async function createCertificate(certificate: Certificate): Promise<void> {
    await db.collection('certificates').doc(certificate.certificate_id).set(certificate);
}

/**
 * Get certificate by ID
 */
export async function getCertificateById(certificateId: string): Promise<Certificate | null> {
    const doc = await db.collection('certificates').doc(certificateId).get();

    if (!doc.exists) {
        return null;
    }

    return doc.data() as Certificate;
}

/**
 * Update certificate status (for revocation)
 */
export async function updateCertificateStatus(
    certificateId: string,
    status: 'valid' | 'revoked',
    reason?: string
): Promise<void> {
    const updateData: any = {
        status,
    };

    if (status === 'revoked') {
        updateData.revoked_at = admin.firestore.Timestamp.now();
        if (reason) {
            updateData.revoked_reason = reason;
        }
    }

    await db.collection('certificates').doc(certificateId).update(updateData);
}

/**
 * Increment verification count
 */
export async function incrementVerificationCount(certificateId: string): Promise<void> {
    await db.collection('certificates').doc(certificateId).update({
        verification_count: admin.firestore.FieldValue.increment(1),
        last_verified_at: admin.firestore.Timestamp.now(),
    });
}

/**
 * Log verification event (append-only)
 */
export async function logVerification(log: VerificationLog): Promise<void> {
    await db.collection('certificate_verifications').add(log);
}

/**
 * Get certificates by lot ID
 */
export async function getCertificatesByLot(lotId: string): Promise<Certificate[]> {
    const snapshot = await db.collection('certificates')
        .where('lot_id', '==', lotId)
        .orderBy('issued_at', 'desc')
        .get();

    return snapshot.docs.map(doc => doc.data() as Certificate);
}

/**
 * Get certificates by issuer ID
 */
export async function getCertificatesByIssuer(issuerId: string): Promise<Certificate[]> {
    const snapshot = await db.collection('certificates')
        .where('issuer_id', '==', issuerId)
        .orderBy('issued_at', 'desc')
        .get();

    return snapshot.docs.map(doc => doc.data() as Certificate);
}

export { db };
