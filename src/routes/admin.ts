import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';
import { authMiddleware } from '../middleware/auth';
import { createCertificate, getCertificateById, updateCertificateStatus } from '../services/firestore';
import { generateCertificatePDF } from '../services/pdf';
import { uploadCertificatePDF } from '../services/r2';
import { generateCertificateId, generateFingerprint, hashPDF } from '../services/cryptoService';

const router = Router();

// All admin routes require authentication
router.use(authMiddleware);

// POST /api/admin/certificates
router.post('/certificates', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { lot_id, expertise_id } = req.body;

        if (!lot_id || !expertise_id) {
            return res.status(400).json({ error: 'lot_id and expertise_id required' });
        }

        const startTime = Date.now();

        // Fetch lot and expertise data
        const db = admin.firestore();
        const lotDoc = await db.collection('lots').doc(lot_id).get();
        const expertiseDoc = expertise_id
            ? await db.collection('expertises').doc(expertise_id).get()
            : null;

        if (!lotDoc.exists) {
            return res.status(404).json({ error: 'Lot not found' });
        }

        const lotData = lotDoc.data();
        const expertiseData = expertiseDoc?.data();

        const certificateId = generateCertificateId();

        const pdfData = {
            certificate_id: certificateId,
            public_fingerprint: '',
            lot: {
                title: lotData?.title || 'Untitled',
                typology: lotData?.typology || 'Unknown',
                period: lotData?.period || 'Unknown',
                materials: lotData?.materials || 'Unknown',
                dimensions: lotData?.dimensions_cm ? JSON.stringify(lotData.dimensions_cm) : undefined,
            },
            expertise: {
                score: expertiseData?.normalized_score || lotData?.score_100 || 0,
                classification: expertiseData?.classification || 'Non classé',
                summary: expertiseData?.expert_summary || lotData?.description || '',
            },
            laboratory: 'Antiquiscore™ Lab',
            issued_at: new Date(),
            verify_url: `${process.env.PUBLIC_VERIFY_BASE_URL}/${certificateId}`,
        };

        const pdfBuffer = await generateCertificatePDF(pdfData);
        const pdfHash = hashPDF(pdfBuffer);
        const fingerprint = generateFingerprint(pdfHash);

        pdfData.public_fingerprint = fingerprint;
        const finalPdfBuffer = await generateCertificatePDF(pdfData);
        const finalHash = hashPDF(finalPdfBuffer);

        const r2Key = await uploadCertificatePDF(certificateId, finalPdfBuffer);

        const certificate = {
            certificate_id: certificateId,
            public_fingerprint: fingerprint,
            version: 1,
            status: 'valid' as const,
            issued_at: admin.firestore.Timestamp.now(),
            lot_id: lot_id,
            issuer_id: userId,
            expertise_id: expertise_id || undefined,
            data_public: {
                title: pdfData.lot.title,
                typology: pdfData.lot.typology,
                period: pdfData.lot.period,
                materials: pdfData.lot.materials,
                dimensions: pdfData.lot.dimensions,
                score: pdfData.expertise.score,
                classification: pdfData.expertise.classification,
                laboratory: pdfData.laboratory,
            },
            pdf: {
                r2_key: r2Key,
                sha256: finalHash,
                size: finalPdfBuffer.length,
            },
            verification_count: 0,
            metadata: {
                ip_address: req.ip || (req.headers['x-forwarded-for'] as string),
                user_agent: req.headers['user-agent'],
                generation_duration_ms: Date.now() - startTime,
            },
        };

        await createCertificate(certificate);

        return res.status(201).json({
            certificate_id: certificateId,
            public_fingerprint: fingerprint,
            verify_url: pdfData.verify_url,
            qr_code_data: pdfData.verify_url,
            issued_at: certificate.issued_at.toDate().toISOString(),
        });
    } catch (error) {
        console.error('Error in createCertificate:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/certificates/:id/revoke
router.post('/certificates/:id/revoke', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || typeof reason !== 'string') {
            return res.status(400).json({ error: 'Revocation reason required' });
        }

        const certificate = await getCertificateById(id);

        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        // Check authorization
        if (certificate.issuer_id !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await updateCertificateStatus(id, 'revoked', reason);

        return res.status(200).json({
            success: true,
            certificate_id: id,
            revoked_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in revokeCertificate:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
