# 🔄 Déploiement via GitHub - Solution

Le Dockerfile sur GitHub est maintenant correct. Voici comment déployer :

## Option 1 : Cloud Build Trigger (Automatique)

### 1. Créer un Trigger Cloud Build

```bash
gcloud builds triggers create github \
  --repo-name=api-service-AS \
  --repo-owner=pulsession-bit \
  --branch-pattern=^main$ \
  --build-config=cloudbuild.yaml \
  --project=deskcompliance-ec7e9
```

Ensuite, chaque push sur `main` déclenchera automatiquement le build.

---

## Option 2 : Build Manuel depuis GitHub (Recommandé)

### 1. Build depuis le Repo GitHub

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=deskcompliance-ec7e9 \
  https://github.com/pulsession-bit/api-service-AS
```

**Note** : Cela va cloner le repo et builder depuis le dernier commit.

---

## Option 3 : Build depuis un Commit Spécifique

```bash
# Utiliser le dernier commit (9411ff7)
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=deskcompliance-ec7e9 \
  --substitutions=COMMIT_SHA=9411ff7 \
  https://github.com/pulsession-bit/api-service-AS
```

---

## Option 4 : Via Console Cloud Build

1. Va sur : https://console.cloud.google.com/cloud-build/builds?project=deskcompliance-ec7e9
2. Clique "RUN TRIGGER" ou "CREATE TRIGGER"
3. Configure :
   - **Source** : GitHub (pulsession-bit/api-service-AS)
   - **Branch** : main
   - **Build configuration** : cloudbuild.yaml
4. Clique "RUN" ou "CREATE"

---

## 🎯 Commande Recommandée (Option 2)

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=deskcompliance-ec7e9 \
  https://github.com/pulsession-bit/api-service-AS
```

Puis une fois l'image buildée :

```bash
gcloud run deploy certificate-api \
  --image gcr.io/deskcompliance-ec7e9/certificate-api \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --project=deskcompliance-ec7e9 \
  --set-secrets="R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest,IP_HASH_PEPPER=IP_HASH_PEPPER:latest" \
  --set-env-vars="R2_ENDPOINT=https://a0a823c68623e410b1e124e91e00f55d.r2.cloudflarestorage.com,R2_BUCKET=antiquisscore1,FIRESTORE_PROJECT_ID=deskcompliance-ec7e9,PUBLIC_VERIFY_BASE_URL=https://antiquiscore.com/verify/c"
```

---

## ✅ Vérification

Le Dockerfile sur GitHub est correct :
```dockerfile
# Install ALL dependencies (including devDependencies for TypeScript)
RUN npm ci
```

✅ Pas de `--only=production` → TypeScript sera installé → Build réussira !

Essaye la commande Option 2 ! 🚀
