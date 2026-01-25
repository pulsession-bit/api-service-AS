# ✅ Configuration Nouveau Conteneur Cloud Run - Certificate API

## 📋 Informations Importantes

**Repository GitHub** : `pulsession-bit/api-service-AS`  
**Branche** : `main` (dernier commit : `ecda4b5`)  
**Dockerfile** : Corrigé avec `RUN npm ci` (sans `--only=production`)

---

## 🚀 Configuration Cloud Run

### 1. Source Code

**Déploiement continu depuis repository** :
- **Provider** : GitHub
- **Repository** : `pulsession-bit/api-service-AS`
- **Branch** : `^main$` (regex)
- **Build type** : Dockerfile
- **Dockerfile location** : `/Dockerfile`

⚠️ **IMPORTANT** : Assure-toi que c'est bien la **branche `main`** et pas un SHA de commit !

---

### 2. Service Configuration

**Basics** :
- **Service name** : `certificate-api`
- **Region** : `europe-west1`
- **CPU allocation** : CPU is only allocated during request processing
- **Minimum instances** : 0
- **Maximum instances** : 10

**Authentication** :
- ✅ **Allow unauthenticated invocations**

---

### 3. Container Configuration

**Resources** :
- **Memory** : 512 MiB
- **CPU** : 1
- **Request timeout** : 60 seconds
- **Maximum concurrent requests** : 80

**Container port** : `8080` (défini dans le code)

---

### 4. Variables & Secrets

#### Secrets (Reference a secret)

Ajoute ces 3 secrets :

1. **R2_ACCESS_KEY_ID**
   - Reference : `R2_ACCESS_KEY_ID:latest`
   - Exposed as : Environment variable
   - Name : `R2_ACCESS_KEY_ID`

2. **R2_SECRET_ACCESS_KEY**
   - Reference : `R2_SECRET_ACCESS_KEY:latest`
   - Exposed as : Environment variable
   - Name : `R2_SECRET_ACCESS_KEY`

3. **IP_HASH_PEPPER**
   - Reference : `IP_HASH_PEPPER:latest`
   - Exposed as : Environment variable
   - Name : `IP_HASH_PEPPER`

#### Environment Variables

Ajoute ces 4 variables :

1. **R2_ENDPOINT**
   - Value : `https://a0a823c68623e410b1e124e91e00f55d.r2.cloudflarestorage.com`

2. **R2_BUCKET**
   - Value : `antiquisscore1`

3. **FIRESTORE_PROJECT_ID**
   - Value : `deskcompliance-ec7e9`

4. **PUBLIC_VERIFY_BASE_URL**
   - Value : `https://antiquiscore.com/verify/c`

---

### 5. Networking (Optionnel)

**Custom domain** (si tu veux `api.antiquiscore.com`) :
- Ajouter après le déploiement via "MANAGE CUSTOM DOMAINS"

---

## 🔐 IAM Permissions (À Configurer Après)

Le service account Cloud Run aura besoin de :

```bash
# Service account par défaut
SERVICE_ACCOUNT="563584335869-compute@developer.gserviceaccount.com"

# Firestore access
gcloud projects add-iam-policy-binding deskcompliance-ec7e9 \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/datastore.user"

# Secrets access (si pas déjà fait)
for SECRET in R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY IP_HASH_PEPPER; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project=deskcompliance-ec7e9
done
```

---

## ✅ Checklist de Création

- [ ] Source : GitHub `pulsession-bit/api-service-AS`
- [ ] Branch : `^main$` (pas de SHA !)
- [ ] Build type : Dockerfile
- [ ] Service name : `certificate-api`
- [ ] Region : `europe-west1`
- [ ] Allow unauthenticated : ✅
- [ ] Memory : 512 MiB
- [ ] CPU : 1
- [ ] Timeout : 60s
- [ ] 3 Secrets configurés
- [ ] 4 Variables d'environnement configurées
- [ ] CREATE !

---

## 🧪 Tests Après Déploiement

Une fois déployé, tu recevras une URL comme :
```
https://certificate-api-xxx-ew.a.run.app
```

**Tests** :

```bash
# Health check
curl https://certificate-api-xxx-ew.a.run.app/health

# Devrait retourner :
# {"status":"ok","timestamp":"...","service":"certificate-api"}

# Test vérification (404 normal)
curl https://certificate-api-xxx-ew.a.run.app/api/public/certificates/test-id

# Devrait retourner :
# {"error":"not_found"}
```

---

## 📝 Prochaines Étapes

1. ✅ Créer le service Cloud Run
2. ✅ Attendre le build (3-5 min)
3. ✅ Tester l'API
4. ✅ Configurer IAM permissions
5. ✅ Mapper le domaine `api.antiquiscore.com` (optionnel)
6. ✅ Déployer le frontend avec `firebase.json` mis à jour

---

**Tout est prêt !** Une fois le service créé, dis-moi l'URL et on teste ! 🚀
