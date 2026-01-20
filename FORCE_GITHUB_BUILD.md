# ⚡ Solution : Forcer le Build depuis le Dernier Commit

Le problème : Cloud Build utilise un commit SHA spécifique (`265ca8c`) au lieu du dernier commit.

## 🎯 Solution : Créer un Nouveau Tag

```bash
cd /Users/raphael/Sites/antiquiscore™-curator-pro\ \(3\)/certificate-api

# Créer un tag pour forcer un nouveau build
git tag v1.0.1
git push origin v1.0.1
```

Puis builder avec le tag :

```bash
gcloud builds submit \
  --tag gcr.io/deskcompliance-ec7e9/certificate-api:v1.0.1 \
  --project=deskcompliance-ec7e9 \
  https://github.com/pulsession-bit/api-service-AS#v1.0.1
```

---

## 🔧 Alternative : Utiliser Cloud Build UI

1. Va sur : https://console.cloud.google.com/cloud-build/builds?project=deskcompliance-ec7e9

2. Clique "SUBMIT BUILD"

3. Configure :
   - **Source** : Repository
   - **Repository** : pulsession-bit/api-service-AS
   - **Branch** : main (pas le SHA)
   - **Build configuration** : Dockerfile
   - **Dockerfile location** : ./Dockerfile

4. Clique "BUILD"

---

## 🚀 Solution la Plus Simple : Deploy Direct

Puisque Cloud Build a des problèmes, utilisons Cloud Run qui va builder lui-même :

```bash
cd /Users/raphael/Sites/antiquiscore™-curator-pro\ \(3\)/certificate-api

gcloud run deploy certificate-api \
  --source=https://github.com/pulsession-bit/api-service-AS \
  --platform=managed \
  --region=europe-west1 \
  --allow-unauthenticated \
  --project=deskcompliance-ec7e9 \
  --set-secrets="R2_ACCESS_KEY_ID=R2_ACCESS_KEY_ID:latest,R2_SECRET_ACCESS_KEY=R2_SECRET_ACCESS_KEY:latest,IP_HASH_PEPPER=IP_HASH_PEPPER:latest" \
  --set-env-vars="R2_ENDPOINT=https://a0a823c68623e410b1e124e91e00f55d.r2.cloudflarestorage.com,R2_BUCKET=antiquisscore1,FIRESTORE_PROJECT_ID=deskcompliance-ec7e9,PUBLIC_VERIFY_BASE_URL=https://antiquiscore.com/verify/c"
```

⚠️ **Note** : `--source` avec une URL GitHub n'est pas supporté directement.

---

## ✅ MEILLEURE SOLUTION : Via Console Cloud Run

1. Va sur : https://console.cloud.google.com/run?project=deskcompliance-ec7e9

2. Clique "CREATE SERVICE"

3. Configure :
   - **Container image URL** : Clique "SELECT" → "Cloud Build" → "SET UP CONTINUOUS DEPLOYMENT"
   - **Repository** : pulsession-bit/api-service-AS
   - **Branch** : main
   - **Build type** : Dockerfile
   
4. Configure le service :
   - **Service name** : certificate-api
   - **Region** : europe-west1
   - **Authentication** : Allow unauthenticated
   
5. **Variables & Secrets** :
   - Secrets : R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, IP_HASH_PEPPER
   - Variables : R2_ENDPOINT, R2_BUCKET, FIRESTORE_PROJECT_ID, PUBLIC_VERIFY_BASE_URL

6. Clique "CREATE"

Cloud Run va automatiquement :
- ✅ Cloner le repo depuis GitHub
- ✅ Builder avec le Dockerfile (dernier commit)
- ✅ Déployer le service

---

**Recommandation** : Utilise la console Cloud Run (solution la plus fiable) ! 🎯
