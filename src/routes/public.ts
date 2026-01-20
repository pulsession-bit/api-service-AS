import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';
import { getCertificateById, incrementVerificationCount, logVerification } from '../services/firestore';
import { generateSignedDownloadUrl } from '../services/r2';
import { hmacForPrivacy } from '../services/cryptoService';
import { noStoreMiddleware } from '../middleware/noStore';

const router = Router();

// Apply no-store to all public routes
router.use(noStoreMiddleware);

// Helper for GDPR logging
async function logEvent(
    certificateId: string,
    result: 'valid' | 'revoked' | 'not_found',
    route: 'verify' | 'download',
    req: Request
) {
    const pepper = process.env.IP_HASH_PEPPER || '';
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await logVerification({
        certificate_id: certificateId,
        ts: admin.firestore.Timestamp.now(),
        ip_hmac: hmacForPrivacy(ipAddress, pepper),
        ua_hmac: hmacForPrivacy(userAgent, pepper),
        result,
        route,
    });
}

// GET /api/public/certificates/:id
router.get('/certificates/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const certificate = await getCertificateById(id);

        if (!certificate) {
            await logEvent(id, 'not_found', 'verify', req);
            return res.status(404).json({ error: 'not_found' });
        }

        await incrementVerificationCount(id);
        await logEvent(id, certificate.status, 'verify', req);

        return res.status(200).json({
            certificate_id: certificate.certificate_id,
            status: certificate.status,
            issued_at: certificate.issued_at.toDate().toISOString(),
            revoked_reason: certificate.revoked_reason || null,
            revoked_at: certificate.revoked_at?.toDate().toISOString() || null,
            public_fingerprint: certificate.public_fingerprint,
            data_public: certificate.data_public,
            verified_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in getCertificate:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/public/certificates/:id/download
router.post('/certificates/:id/download', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const certificate = await getCertificateById(id);

        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        // Re-check status (critical)
        if (certificate.status !== 'valid') {
            await logEvent(id, 'revoked', 'download', req);
            return res.status(403).json({
                error: 'revoked',
                reason: certificate.revoked_reason || 'Certificate has been revoked',
            });
        }

        const signedUrl = await generateSignedDownloadUrl(
            certificate.pdf.r2_key,
            120,
            certificate.public_fingerprint
        );

        await logEvent(id, 'valid', 'download', req);

        return res.status(200).json({
            url: signedUrl,
            expires_in: 120,
            filename: `certificate-${certificate.public_fingerprint}.pdf`,
        });
    } catch (error) {
        console.error('Error in downloadCertificate:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
