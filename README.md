# Certificate API - Cloud Run

Standalone certificate API for deployment on Cloud Run.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Run Locally

```bash
# Set environment variables
export R2_ENDPOINT="https://a0a823c68623e410b1e124e91e00f55d.r2.cloudflarestorage.com"
export R2_BUCKET="antiquisscore1"
export R2_ACCESS_KEY_ID="5a7eb5a4995f23a3c72c2bfb97f2ab3e"
export R2_SECRET_ACCESS_KEY="8cb41aaae21c3a8b51305b2f395c4a440c02674a120b01f7a1ac475881b63d45"
export IP_HASH_PEPPER="e570f48b4775735a42a38a25bef790ff38cd4adfecd1653f14e525adb7b3a61f"
export FIRESTORE_PROJECT_ID="deskcompliance-ec7e9"
export PUBLIC_VERIFY_BASE_URL="http://localhost:5173/verify/c"
export PORT=8080

# Start server
npm start
```

### 4. Test

```bash
# Health check
curl http://localhost:8080/health

# Test verification (will return 404 - normal)
curl http://localhost:8080/api/public/certificates/test-id
```

---

## Deploy to Cloud Run

### 1. Build & Push Image

```bash
gcloud builds submit --tag gcr.io/deskcompliance-ec7e9/certificate-api
```

### 2. Deploy

```bash
gcloud run deploy certificate-api \
  --image gcr.io/deskcompliance-ec7e9/certificate-api \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-secrets="R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest,IP_HASH_PEPPER=IP_HASH_PEPPER:latest" \
  --set-env-vars="R2_ENDPOINT=https://a0a823c68623e410b1e124e91e00f55d.r2.cloudflarestorage.com,R2_BUCKET=antiquisscore1,FIRESTORE_PROJECT_ID=deskcompliance-ec7e9,PUBLIC_VERIFY_BASE_URL=https://antiquiscore.com/verify/c" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60s \
  --max-instances=10 \
  --min-instances=0
```

### 3. Get Service URL

```bash
gcloud run services describe certificate-api --region=europe-west1 --format='value(status.url)'
```

---

## API Endpoints

### Public (No Auth)

**GET /api/public/certificates/:id**
- Verify certificate status
- Returns: certificate data + status

**POST /api/public/certificates/:id/download**
- Generate signed URL for PDF download
- Returns: signed URL (120s TTL)

### Admin (Auth Required)

**POST /api/admin/certificates**
- Generate new certificate
- Headers: `Authorization: Bearer <firebase-id-token>`
- Body: `{ "lot_id": "...", "expertise_id": "..." }`

**POST /api/admin/certificates/:id/revoke**
- Revoke certificate
- Headers: `Authorization: Bearer <firebase-id-token>`
- Body: `{ "reason": "..." }`

---

## Environment Variables

**Required**:
- `R2_ENDPOINT` - Cloudflare R2 endpoint
- `R2_BUCKET` - R2 bucket name
- `R2_ACCESS_KEY_ID` - R2 access key (from Secret Manager)
- `R2_SECRET_ACCESS_KEY` - R2 secret key (from Secret Manager)
- `IP_HASH_PEPPER` - GDPR privacy pepper (from Secret Manager)
- `FIRESTORE_PROJECT_ID` - Firebase project ID
- `PUBLIC_VERIFY_BASE_URL` - Base URL for verification (e.g., `https://antiquiscore.com/verify/c`)

**Optional**:
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (default: production)

---

## IAM Permissions

The Cloud Run service account needs:

1. **Firestore**: `roles/datastore.user`
2. **Secret Manager**: `roles/secretmanager.secretAccessor` (for secrets)

Grant permissions:

```bash
SERVICE_ACCOUNT="YOUR-SERVICE-ACCOUNT@deskcompliance-ec7e9.iam.gserviceaccount.com"

# Firestore
gcloud projects add-iam-policy-binding deskcompliance-ec7e9 \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/datastore.user"

# Secrets
for SECRET in R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY IP_HASH_PEPPER; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project=deskcompliance-ec7e9
done
```

---

## Testing

### Smoke Tests

```bash
# Health check
curl https://YOUR-SERVICE-URL/health

# Verify (404 expected)
curl https://YOUR-SERVICE-URL/api/public/certificates/test-id

# Generate (requires auth token)
curl -X POST https://YOUR-SERVICE-URL/api/admin/certificates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"lot_id": "LOT_ID", "expertise_id": "EXPERTISE_ID"}'
```

---

## Architecture

```
src/
├── server.ts              # Express app + Firebase init
├── routes/
│   ├── public.ts          # GET /certificates/:id, POST /certificates/:id/download
│   └── admin.ts           # POST /certificates, POST /certificates/:id/revoke
├── services/
│   ├── firestore.ts       # Firestore operations (ADC/IAM)
│   ├── r2.ts              # R2 upload + signed URLs
│   ├── pdf.ts             # PDF generation (pdf-lib)
│   └── cryptoService.ts   # SHA-256 + HMAC + ULID
└── middleware/
    ├── auth.ts            # Firebase ID token verification
    └── noStore.ts         # Cache-Control headers
```

---

## Production Ready ✅

- Multi-stage Dockerfile (slim image)
- ADC/IAM for Firestore (no service account JSON)
- Secrets from Secret Manager
- HMAC-based GDPR logging
- No-cache headers
- Health check endpoint
- Error handling
- TypeScript strict mode
