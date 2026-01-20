import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import admin from 'firebase-admin';
import publicRoutes from './routes/public';
import adminRoutes from './routes/admin';

// Initialize Firebase Admin (uses ADC/IAM in Cloud Run)
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: process.env.FIRESTORE_PROJECT_ID || 'deskcompliance-ec7e9',
    });
}

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

// Trust proxy (for Cloud Run)
app.set('trust proxy', true);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'certificate-api',
    });
});

// Routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Certificate API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Project ID: ${process.env.FIRESTORE_PROJECT_ID || 'deskcompliance-ec7e9'}`);
});

export default app;
