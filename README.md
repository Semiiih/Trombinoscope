# Trombinoscope 

Application de gestion de trombinoscopes scolaires.
Backend Node.js + Express + Prisma — Frontend React + Vite + Tailwind CSS.

---

## Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (backend + BDD)
- [Node.js 20+](https://nodejs.org/) + [pnpm](https://pnpm.io/) (frontend)

---

## Lancer le projet

### 1. Backend + Base de données (Docker)

```bash
# Depuis la racine du projet
docker compose up -d
```

> La première fois : Docker build l'image, crée la BDD et les tables automatiquement.

Vérifier que tout tourne :

```bash
docker compose ps
curl http://localhost:3000/health
```

### 2. Frontend (Back Office)

```bash
cd back-office
pnpm install   # uniquement la première fois
pnpm dev
```

Ouvrir http://localhost:5173

---

## URLs disponibles

| Service     | URL                   | Description           |
| ----------- | --------------------- | --------------------- |
| Back Office | http://localhost:5173 | Interface React       |
| API         | http://localhost:3000 | REST API              |
| Adminer     | http://localhost:8089 | Interface BDD simple  |
| pgAdmin     | http://localhost:5050 | Interface BDD avancée |

**pgAdmin** — login : `admin@trombi.local` / `admin`

---

## Commandes Docker essentielles

```bash
# Démarrer les conteneurs en arrière-plan
docker compose up -d

# Démarrer et voir les logs en direct
docker compose up

# Arrêter les conteneurs (données conservées)
docker compose down

# Arrêter ET supprimer toutes les données (BDD + photos)
docker compose down -v

# Voir les logs du backend
docker logs trombi_backend

# Voir les logs en temps réel
docker logs -f trombi_backend

# Reconstruire l'image après modification du code backend
docker compose up -d --build
```

---

## Seed (jeu de données par défaut)

Le seed insère 3 classes et 15 élèves avec leurs photos.

### Lancer le seed

```bash
docker cp backend/prisma/seed.js trombi_backend:/app/prisma/seed.js
docker exec trombi_backend node prisma/seed.js
```

### Ajouter ou modifier des avatars

1. Placer les images dans `backend/prisma/avatars/` (JPEG ou PNG)
2. Mettre à jour `backend/prisma/seed.js` avec le bon nom de fichier
3. Copier et relancer :

```bash
docker cp backend/prisma/avatars/mon_avatar.jpg trombi_backend:/app/prisma/avatars/mon_avatar.jpg
docker cp backend/prisma/seed.js trombi_backend:/app/prisma/seed.js
docker exec trombi_backend node prisma/seed.js
```

---

## Base de données

### Accès direct (terminal)

```bash
docker exec -it trombi_postgres psql -U trombi -d trombinoscope
```

Commandes utiles dans psql :

```sql
\dt                     -- lister les tables
SELECT * FROM "Class";
SELECT * FROM "Student";
\q                      -- quitter
```

### Connexion GUI (Adminer, pgAdmin, TablePlus...)

```
Host:     localhost
Port:     5432
Database: trombinoscope
User:     trombi
Password: trombi_secret
```

---

## Migrations BDD (nouvelle version du schéma)

Quand tu modifies `backend/prisma/schema.prisma` :

### Option A — db push (développement rapide, sans historique)

```bash
docker exec trombi_backend npx prisma db push --accept-data-loss
```

### Option B — Migration versionnée (recommandé en production)

```bash
# 1. Créer le fichier de migration localement
cd backend
npx prisma migrate dev --name nom_de_la_migration

# 2. Rebuilder et relancer
cd ..
docker compose up -d --build

# Re build uniquement le backend (plus rapide). L'autre commande rebuild tout (postgres, adminer, pgadmin)
docker compose up --build backend -d
```

> Les migrations sont stockées dans `backend/prisma/migrations/`
> et appliquées automatiquement au démarrage du conteneur.

---

## Tests

```bash
cd backend
npm test                  # tous les tests
npm run test:coverage     # avec rapport de couverture
```

Les tests utilisent des mocks Prisma — pas besoin de BDD active.

Suites disponibles :

- `tests/health.test.js` — health check
- `tests/class.test.js` — CRUD classes
- `tests/student.test.js` — CRUD élèves
- `tests/csv.test.js` — import CSV
- `tests/trombi.test.js` — génération trombinoscope

---

## Import CSV

Format attendu :

```csv
first_name,last_name,email,class_label,year
Alice,Dupont,alice@example.com,BTS SIO,2024-2025
```

- Si la classe n'existe pas → elle est créée automatiquement
- Si l'email existe déjà → l'élève est mis à jour (upsert)

---

## API REST — Référence rapide

### Classes

```
GET    /api/classes
POST   /api/classes        { label, year }
PUT    /api/classes/:id    { label, year }
DELETE /api/classes/:id
```

### Élèves

```
GET    /api/students?class_id=&q=
POST   /api/students       { firstName, lastName, email, classId }
PUT    /api/students/:id
DELETE /api/students/:id
POST   /api/students/:id/photo   multipart "photo" — JPEG/PNG max 5MB
POST   /api/students/import      multipart "file"  — CSV max 2MB
```

### Trombinoscope

```
GET    /api/trombi?class_id=&format=html|pdf
```

---

## Structure du projet

```
Trombinoscope-v2/
├── back-office/                  Frontend React (Vite + Tailwind)
│   ├── src/
│   │   ├── api/client.ts         Appels API centralisés
│   │   ├── components/Layout.tsx Sidebar navigation
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Classes.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── ImportCsv.tsx
│   │   │   └── Trombi.tsx
│   │   └── types/index.ts
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/          Gestion requêtes/réponses
│   │   ├── services/             Logique métier
│   │   ├── routes/               Définition des routes
│   │   ├── middlewares/          Validation, upload, erreurs
│   │   ├── utils/                Logger, fileHelper
│   │   ├── config/prisma.js      Instance Prisma singleton
│   │   ├── app.js                Configuration Express
│   │   └── server.js             Point d'entrée
│   ├── prisma/
│   │   ├── schema.prisma         Modèles BDD
│   │   ├── seed.js               Données de départ
│   │   └── avatars/              Photos par défaut pour le seed
│   ├── tests/                    Tests Jest + Supertest
│   ├── uploads/                  Photos uploadées (ignoré par git)
│   ├── exports/                  Fichiers trombi générés (ignoré par git)
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Variables d'environnement

Copier `backend/.env.example` en `backend/.env` pour le développement local :

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://trombi:trombi_secret@localhost:5432/trombinoscope"
UPLOAD_DIR=./uploads
```
