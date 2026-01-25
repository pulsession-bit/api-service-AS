# 🔴 PROBLÈME IDENTIFIÉ : Cloud Build utilise un SHA fixe

Cloud Build utilise **toujours** le commit `265ca8c` au lieu de `main`.

## ✅ SOLUTION : Supprimer et Recréer le Trigger

### 1. Lister les Triggers Existants

```bash
gcloud builds triggers list --project=deskcompliance-ec7e9
```

### 2. Supprimer le Trigger Problématique

```bash
# Remplace TRIGGER_ID par l'ID du trigger
gcloud builds triggers delete TRIGGER_ID --project=deskcompliance-ec7e9
```

### 3. Via Console (Plus Simple)

1. **Va sur** : https://console.cloud.google.com/cloud-build/triggers?project=deskcompliance-ec7e9

2. **Trouve le trigger** pour `api-service-AS`

3. **Clique sur les 3 points** → **DELETE**

4. **Crée un nouveau trigger** :
   - Clique "CREATE TRIGGER"
   - Name : `certificate-api-build`
   - Event : Push to a branch
   - Source : pulsession-bit/api-service-AS
   - Branch : `^main$` (regex, pas un SHA!)
   - Build configuration : Dockerfile
   - Dockerfile location : `/Dockerfile`
   - Image name : `gcr.io/deskcompliance-ec7e9/certificate-api`

5. **SAVE**

6. **RUN TRIGGER** manuellement

---

## 🎯 ALTERNATIVE : Déployer Directement via Console Cloud Run

Au lieu de passer par Cloud Build, utilise Cloud Run qui va gérer le build :

1. **Va sur** : https://console.cloud.google.com/run?project=deskcompliance-ec7e9

2. Si le service existe déjà :
   - Clique sur `certificate-api`
   - Clique "EDIT & DEPLOY NEW REVISION"
   - Change "Container image URL" → "Deploy from source"
   - Repository : pulsession-bit/api-service-AS
   - Branch : main
   - Build type : Dockerfile

3. Si le service n'existe pas :
   - "CREATE SERVICE"
   - "Continuously deploy from repository"
   - Suis les étapes de configuration

---

## 🚨 IMPORTANT

Le problème est que le trigger/build est configuré avec un **commit SHA spécifique** (`265ca8c`) au lieu de la **branche** `main`.

Il faut absolument :
- ✅ Supprimer l'ancien trigger
- ✅ Créer un nouveau trigger pointant vers `main` (pas un SHA)
- ✅ Ou utiliser Cloud Run qui gère mieux les builds depuis GitHub

---

**Recommandation** : Utilise la console Cloud Run pour déployer directement depuis le repo GitHub. C'est plus fiable ! 🎯
