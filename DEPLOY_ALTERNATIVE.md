# 🔧 Solution Alternative : Build Local + Push

Le build Cloud Build a des problèmes de cache. Voici la solution :

## Option 1 : Build depuis le Répertoire Local

```bash
cd /Users/raphael/Sites/antiquiscore™-curator-pro\ \(3\)/certificate-api

# Build l'image localement avec Docker
docker build -t gcr.io/deskcompliance-ec7e9/certificate-api .

# Push vers GCR
docker push gcr.io/deskcompliance-ec7e9/certificate-api
```

**Note** : Nécessite Docker installé localement.

---

## Option 2 : Utiliser gcloud builds submit depuis le Dossier Local

```bash
cd /Users/raphael/Sites/antiquiscore™-curator-pro\ \(3\)/certificate-api

# Build depuis le dossier local (pas depuis GitHub)
gcloud builds submit --tag gcr.io/deskcompliance-ec7e9/certificate-api .
```

Cela va utiliser le Dockerfile local (avec le fix) au lieu du cache GitHub.

---

## Option 3 : Deploy Directement depuis le Code Source

```bash
cd /Users/raphael/Sites/antiquiscore™-curator-pro\ \(3\)/certificate-api

# Deploy directement depuis le code source (Cloud Run va builder)
gcloud run deploy certificate-api \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --project=deskcompliance-ec7e9 \
  --set-secrets="R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest,IP_HASH_PEPPER=IP_HASH_PEPPER:latest" \
  --set-env-vars="R2_ENDPOINT=https://a0a823c68623e410b1e124e91e00f55d.r2.cloudflarestorage.com,R2_BUCKET=antiquisscore1,FIRESTORE_PROJECT_ID=deskcompliance-ec7e9,PUBLIC_VERIFY_BASE_URL=https://antiquiscore.com/verify/c"
```

✅ **Option 3 est la plus simple** - Cloud Run va automatiquement builder et déployer !

---

## 🚀 Commande Recommandée

```bash
cd certificate-api

gcloud run deploy certificate-api \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --project=deskcompliance-ec7e9 \
  --set-secrets="R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest,IP_HASH_PEPPER=IP_HASH_PEPPER:latest" \
  --set-env-vars="R2_ENDPOINT=https://a0a823c68623e410b1e124e91e00f55d.r2.cloudflarestorage.com,R2_BUCKET=antiquisscore1,FIRESTORE_PROJECT_ID=deskcompliance-ec7e9,PUBLIC_VERIFY_BASE_URL=https://antiquiscore.com/verify/c" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60s
```

Cela va :
1. ✅ Builder depuis le code local (avec le Dockerfile fixé)
2. ✅ Créer l'image
3. ✅ Déployer sur Cloud Run
4. ✅ Configurer tous les secrets et variables

**Temps estimé** : 3-5 minutes

Essaye cette commande ! 🎯
