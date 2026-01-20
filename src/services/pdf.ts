import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { hashPDF } from './cryptoService';

export interface CertificateDataForPDF {
    certificate_id: string;
    public_fingerprint: string;
    lot: {
        title: string;
        typology: string;
        period: string;
        materials: string;
        dimensions?: string;
    };
    expertise: {
        score: number;
        classification: string;
        summary: string;
    };
    laboratory: string;
    issued_at: Date;
    verify_url: string;
}

export async function generateCertificatePDF(data: CertificateDataForPDF): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4

    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const { width, height } = page.getSize();

    // Header
    page.drawRectangle({
        x: 0,
        y: height - 60,
        width,
        height: 60,
        color: rgb(0.06, 0.09, 0.16), // slate-900
    });

    page.drawText('ANTIQUISCORE™', {
        x: 40,
        y: height - 35,
        size: 24,
        font: helveticaBold,
        color: rgb(1, 1, 1),
    });

    page.drawText('CERTIFICAT D\'AUTHENTICITÉ', {
        x: 40,
        y: height - 50,
        size: 12,
        font: helvetica,
        color: rgb(1, 1, 1),
    });

    let yPos = height - 100;

    // Certificate ID
    page.drawText('Certificate ID:', {
        x: 40,
        y: yPos,
        size: 10,
        font: helvetica,
    });
    page.drawText(data.certificate_id, {
        x: 140,
        y: yPos,
        size: 9,
        font: helveticaBold,
    });

    yPos -= 20;

    // Fingerprint
    page.drawText('Fingerprint:', {
        x: 40,
        y: yPos,
        size: 10,
        font: helvetica,
    });
    page.drawText(data.public_fingerprint, {
        x: 140,
        y: yPos,
        size: 16,
        font: helveticaBold,
        color: rgb(0.15, 0.39, 0.92), // blue-600
    });

    yPos -= 40;

    // Lot Information
    page.drawRectangle({
        x: 40,
        y: yPos - 80,
        width: width - 80,
        height: 100,
        color: rgb(0.95, 0.96, 0.98), // slate-100
    });

    yPos -= 15;
    page.drawText('INFORMATIONS DU LOT', {
        x: 50,
        y: yPos,
        size: 12,
        font: helveticaBold,
    });

    yPos -= 20;
    page.drawText(`Titre: ${data.lot.title}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: helvetica,
        maxWidth: width - 100,
    });

    yPos -= 15;
    page.drawText(`Typologie: ${data.lot.typology}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: helvetica,
    });

    yPos -= 15;
    page.drawText(`Période: ${data.lot.period}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: helvetica,
    });

    yPos -= 15;
    page.drawText(`Matériaux: ${data.lot.materials}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: helvetica,
    });

    yPos -= 40;

    // Expertise
    page.drawRectangle({
        x: 40,
        y: yPos - 50,
        width: width - 80,
        height: 60,
        color: rgb(0.94, 0.96, 1), // blue-50
    });

    yPos -= 15;
    page.drawText('RÉSUMÉ DE L\'EXPERTISE', {
        x: 50,
        y: yPos,
        size: 12,
        font: helveticaBold,
    });

    yPos -= 20;
    page.drawText(`Score ANTIQUISCORE™: ${data.expertise.score}/100`, {
        x: 50,
        y: yPos,
        size: 10,
        font: helveticaBold,
        color: rgb(0.15, 0.39, 0.92),
    });

    yPos -= 15;
    page.drawText(`Classification: ${data.expertise.classification}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: helvetica,
    });

    yPos -= 40;

    // Laboratory & Date
    page.drawText(`Laboratoire: ${data.laboratory}`, {
        x: 40,
        y: yPos,
        size: 10,
        font: helvetica,
    });

    yPos -= 15;
    page.drawText(`Date d'émission: ${data.issued_at.toLocaleDateString('fr-FR')}`, {
        x: 40,
        y: yPos,
        size: 10,
        font: helvetica,
    });

    // QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(data.verify_url, {
        width: 200,
        margin: 1,
    });

    const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
    const qrSize = 100;

    page.drawImage(qrImage, {
        x: width - qrSize - 40,
        y: 80,
        width: qrSize,
        height: qrSize,
    });

    page.drawText('Vérifier sur:', {
        x: width - qrSize - 40,
        y: 70,
        size: 8,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText('antiquiscore.com', {
        x: width - qrSize - 40,
        y: 60,
        size: 8,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4),
    });

    // Watermark
    page.drawText(data.public_fingerprint, {
        x: width / 2 - 100,
        y: height / 2,
        size: 60,
        font: helveticaBold,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3,
    });

    // Footer
    page.drawText(
        'Ce certificat atteste de l\'analyse effectuée par ANTIQUISCORE™.',
        {
            x: 40,
            y: 30,
            size: 7,
            font: helvetica,
            color: rgb(0.4, 0.4, 0.4),
            maxWidth: width - qrSize - 80,
        }
    );

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

export function calculatePDFHash(pdfBuffer: Buffer): string {
    return hashPDF(pdfBuffer);
}
