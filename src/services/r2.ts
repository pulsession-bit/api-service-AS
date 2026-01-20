import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
const R2_BUCKET = process.env.R2_BUCKET || 'antiquisscore1';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';

const s3Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

/**
 * Upload certificate PDF to R2
 * @returns R2 key (path)
 */
export async function uploadCertificatePDF(
    certificateId: string,
    pdfBuffer: Buffer
): Promise<string> {
    const r2Key = `certificates/${certificateId}.pdf`;

    const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
    });

    await s3Client.send(command);

    return r2Key;
}

/**
 * Generate signed download URL for certificate PDF
 * @param r2Key - R2 object key
 * @param ttlSeconds - Time to live in seconds (default: 120)
 * @param fingerprint - Certificate fingerprint for filename
 * @returns Signed URL
 */
export async function generateSignedDownloadUrl(
    r2Key: string,
    ttlSeconds: number = 120,
    fingerprint: string = ''
): Promise<string> {
    const filename = fingerprint
        ? `certificate-${fingerprint}.pdf`
        : 'certificate.pdf';

    const command = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
        ResponseCacheControl: 'no-store',
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: ttlSeconds,
    });

    return signedUrl;
}

/**
 * Delete certificate PDF from R2 (for cleanup)
 */
export async function deleteCertificatePDF(r2Key: string): Promise<void> {
    // Implementation if needed for cleanup
    // Not critical for MVP
}
