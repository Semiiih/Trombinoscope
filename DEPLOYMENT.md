# Déploiement sur Render

Guide pas-à-pas pour déployer le Trombinoscope (backend + frontend + BDD) sur Render en utilisant le free tier.

## Architecture cible

```
[Navigateur]
    │
    ├─▶ trombi-frontend.onrender.com   (Static Site - Vite/React)
    │
    └─▶ trombi-backend.onrender.com    (Web Service - Docker/Node)
              │
              └─▶ trombi-db.frankfurt-postgres.render.com  (PostgreSQL Free)
```

Tous les services sont hébergés dans la région **Frankfurt (EU Central)** pour minimiser la latence.

---

## Prérequis

- Un compte [Render.com](https://render.com) connecté à GitHub
- Accès au repo `Semiiih/Trombinoscope` (collaborator)
- `openssl` pour générer un secret JWT

---

## 1. Créer la base PostgreSQL

1. **Dashboard Render** → **New +** → **Postgres**
2. Configuration :

   | Champ | Valeur |
   |---|---|
   | Name | `trombi-db` |
   | Region | **Frankfurt (EU Central)** |
   | PostgreSQL Version | 16 ou 18 |
   | Instance Type | **Free** |

3. Clique **Create Database**
4. Attends ~1-3 min que le statut passe **Available**
5. Dans la section **Connections**, copie l'**Internal Database URL** (format : `postgresql://user:pass@host/db`)

> ⚠️ **Limites du free tier** : 1 GB stockage, expiration 90 jours, suspension après 30 jours sans connexion.

---

## 2. Déployer le backend (Web Service)

1. **Dashboard Render** → **New +** → **Web Service**
2. **Source** : Connecter le repo GitHub `Semiiih/Trombinoscope`
3. Configuration :

   | Champ | Valeur |
   |---|---|
   | Name | `trombi-backend` |
   | Language | **Docker** |
   | Branch | `main` |
   | Region | **Frankfurt (EU Central)** |
   | Root Directory | `backend` |
   | Dockerfile Path | `./Dockerfile` |
   | Instance Type | **Free** |
   | Health Check Path | `/health` |

4. **Environment Variables** (6 variables) :

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `DATABASE_URL` | Internal Database URL copiée à l'étape 1 |
   | `JWT_SECRET` | Voir ci-dessous |
   | `STORAGE` | `local` |
   | `UPLOAD_DIR` | `/app/uploads` |

   Générer `JWT_SECRET` :
   ```bash
   openssl rand -hex 32
   ```

5. **Auto-Deploy** : `On Commit` (Render redéploie à chaque push sur main)
6. Clique **Deploy Web Service**

Le build prend ~5-8 min (multi-stage : deps → build → production).

### Notes techniques

- Le `CMD` du [Dockerfile](backend/Dockerfile) lance automatiquement `npx prisma db push` au démarrage pour synchroniser le schéma de la BDD.
- Health check sur `/health` → renvoie `{"status":"ok"}`.
- ⚠️ Free tier : le service **s'endort après 15 min** d'inactivité. La 1ère requête prendra ~50s.

---

## 3. Déployer le frontend (Static Site)

1. **Dashboard Render** → **New +** → **Static Site**
2. **Repo** : `Semiiih/Trombinoscope` (même que le backend)
3. Configuration :

   | Champ | Valeur |
   |---|---|
   | Name | `trombi-frontend` |
   | Branch | `main` |
   | Root Directory | `back-office` |
   | Build Command | `npx -y pnpm@9 install --frozen-lockfile && npx -y pnpm@9 build` |
   | Publish Directory | `dist` |

4. **Environment Variables** :

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://trombi-backend.onrender.com` |

5. **Redirects/Rewrites** (à configurer après création, onglet **Redirects/Rewrites**) — pour React Router SPA :

   | Source | Destination | Action |
   |---|---|---|
   | `/*` | `/index.html` | **Rewrite** |

6. Clique **Deploy Static Site**

Le build prend ~2-3 min. Pas de spin-down (CDN).

> ⚠️ **Pourquoi `npx pnpm` et pas `corepack enable` ?** Sur Render, `/usr/bin` et `/usr/lib` sont en lecture seule. `corepack enable` et `npm install -g` échouent. `npx -y pnpm@9` utilise un cache temporaire writable.

---

## 4. Configurer la CI/CD GitHub Actions

Le pipeline [.github/workflows/ci.yml](.github/workflows/ci.yml) déclenche un redéploiement automatique sur Render à chaque push sur `main`.

### Récupérer les Deploy Hooks Render

1. Sur **trombi-backend** → **Settings** → **Deploy Hook** → copie l'URL
2. Sur **trombi-frontend** → **Settings** → **Deploy Hook** → copie l'URL

### Ajouter les secrets GitHub

Sur GitHub : repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Nom du secret | Valeur |
|---|---|
| `RENDER_DEPLOY_HOOK_BACKEND` | URL du deploy hook backend |
| `RENDER_DEPLOY_HOOK_FRONTEND` | URL du deploy hook frontend |

### Workflow CI

Le workflow exécute 3 jobs sur chaque push :

1. **test** — installe les deps, lance les tests backend (Jest) + lint/build frontend (TS + Vite)
2. **build** — build des images Docker (backend + frontend) et push sur GHCR (uniquement sur `main`)
3. **deploy** — déclenche les deploy hooks Render (uniquement sur `main`)

---

## 5. Vérifier le déploiement

| Service | URL | Test |
|---|---|---|
| Backend health | https://trombi-backend.onrender.com/health | doit retourner `{"status":"ok",...}` |
| Backend API | https://trombi-backend.onrender.com/api/classes | doit retourner `401 Unauthorized` (auth requise) |
| Frontend | https://trombi-frontend.onrender.com | doit afficher la page de login |

### Première utilisation

Si la BDD est vide, il faut créer un user admin. Connecte-toi en SSH au backend (paid tier uniquement) **ou** ajoute un seed en local et lance-le contre la BDD prod :

```bash
DATABASE_URL="postgresql://...render.com/trombi_db" node backend/prisma/seed.js
```

---

## Limites du free tier & solutions

| Problème | Solution |
|---|---|
| Backend s'endort après 15 min | Passer au plan Starter ($7/mois) ou pinger toutes les 10 min via cron-job.org |
| Photos uploadées perdues au redeploy | Utiliser un S3 externe (Cloudflare R2, Backblaze B2, AWS S3) au lieu de `STORAGE=local` |
| BDD expire à 90 jours | Créer une nouvelle DB ou passer au plan payant |
| BDD suspendue après 30j sans connexion | Pinger périodiquement |

### Migration vers S3 externe (optionnel)

Quand tu veux un stockage persistant :

```bash
# Sur le backend trombi-backend, change/ajoute les env vars :
STORAGE=s3
S3_ENDPOINT=https://<endpoint>     # ex: s3.eu-west-1.amazonaws.com ou r2 endpoint
S3_PUBLIC_URL=https://<bucket-public-url>
S3_BUCKET=trombi-uploads
S3_KEY=<access-key>
S3_SECRET=<secret>
S3_REGION=eu-west-1
```

Voir [backend/src/services/storageService.js](backend/src/services/storageService.js) pour les détails.

---

## Troubleshooting

### Build backend échoue avec "Exited with status 127"
Le champ **Docker Command** sur Render ne supporte pas `&&`. La commande est déjà dans le Dockerfile. **Vide complètement** le champ Docker Command dans Settings.

### Build frontend échoue avec EROFS
`corepack enable` ou `npm install -g` ne marchent pas sur Render (FS read-only). Utiliser :
```
npx -y pnpm@9 install --frozen-lockfile && npx -y pnpm@9 build
```

### Frontend 404 au refresh
Vérifier que la rewrite rule `/* → /index.html` (action: **Rewrite**) est bien configurée.

### Backend retourne 502
Probablement un crash au démarrage. Voir les logs sur Render → **Logs**. Causes fréquentes :
- `DATABASE_URL` mal configurée
- `JWT_SECRET` manquant
- Prisma push échoue (vérifier que la BDD est `Available`)

### "It looks like we don't have access to your repo"
Le repo est sur `Semiiih`, pas sur ton compte. Tu dois être ajouté comme **Collaborator** par le propriétaire pour que l'auto-deploy fonctionne.

---

## Récapitulatif des secrets

| Endroit | Variable | Usage |
|---|---|---|
| Render backend env | `JWT_SECRET` | Signature JWT |
| Render backend env | `DATABASE_URL` | Connexion Postgres |
| Render frontend env | `VITE_API_URL` | URL API en build time |
| GitHub Actions secrets | `RENDER_DEPLOY_HOOK_BACKEND` | Trigger redeploy backend |
| GitHub Actions secrets | `RENDER_DEPLOY_HOOK_FRONTEND` | Trigger redeploy frontend |
