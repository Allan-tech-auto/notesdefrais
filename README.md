# Notes de Frais

Application de gestion de notes de frais, déployée sur Cloudflare Workers avec une base de données D1.

## Stack technique

- **Backend** : [Hono](https://hono.dev/) sur Cloudflare Workers
- **Base de données** : Cloudflare D1 (SQLite)
- **Frontend** : HTML/CSS/JS vanilla (dans `public/`)
- **OCR** : API Mindee (scan de reçus)
- **Auth** : JWT via [jose](https://github.com/panva/jose)

## Structure

```
├── public/           # Frontend (HTML/CSS/JS)
├── src/worker/
│   ├── index.ts      # Entrée principale, routes API
│   ├── auth.ts       # JWT, hash de mot de passe
│   ├── db.ts         # Requêtes D1
│   └── storage.ts    # Stockage fichiers
├── schema.sql        # Schéma base de données
├── wrangler.toml     # Config Cloudflare Workers
└── reset-password.js # Script utilitaire reset mdp
```

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil utilisateur |
| POST | `/api/auth/security-question` | Définir question secrète |
| POST | `/api/auth/forgot-password` | Récupérer question secrète |
| POST | `/api/auth/reset-password` | Réinitialiser mot de passe |
| GET | `/api/mission` | Récupérer la mission |
| PUT | `/api/mission` | Modifier la mission |
| GET | `/api/expenses` | Liste des dépenses |
| POST | `/api/expenses` | Créer une dépense |
| PUT | `/api/expenses/:id` | Modifier une dépense |
| DELETE | `/api/expenses/:id` | Supprimer une dépense |
| POST | `/api/ocr` | Analyser un reçu (OCR) |

## Installation

```bash
npm install
```

## Configuration des secrets

```bash
wrangler secret put JWT_SECRET
wrangler secret put MINDEE_API_KEY
```

## Base de données

```bash
# Créer la base
npm run db:create

# Appliquer le schéma
npm run db:migrate
```

## Développement local

```bash
npm run dev
```

## Déploiement

```bash
npm run deploy
```

## URL de production

`https://notedefrais-api.allan-banas1.workers.dev`
