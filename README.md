# Notes de Frais

Application de gestion de notes de frais, déployée sur Cloudflare Workers avec une base de données D1.

## Stack technique

- **Backend** : [Hono](https://hono.dev/) sur Cloudflare Workers
- **Base de données** : Cloudflare D1 (SQLite)
- **Frontend** : HTML/CSS/JS vanilla (dans `public/`)
- **OCR** : Cloudflare Workers AI — `@cf/meta/llama-3.2-11b-vision-instruct`
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
| POST | `/api/ocr` | Analyser un reçu (OCR via Workers AI) |

## OCR — Cloudflare Workers AI

L'OCR utilise le modèle `@cf/meta/llama-3.2-11b-vision-instruct` via le binding `env.AI`.
Remplace l'ancienne intégration Mindee (supprimée).

**Champs extraits :**
- `supplierName` — texte en ALL CAPS ou plus grand titre en haut du document (jamais une signature)
- `date` — convertie en `YYYY-MM-DD`
- `time` — format `HH:MM`
- `totalAmount` — montant **TTC** uniquement (jamais HT)
- `currency` — devise (défaut `EUR`)
- `category` — voir ci-dessous

**Catégories détectées (ordre de priorité) :**
1. `logement` — hotel, hébergement, airbnb, Ibis, Mercure, Marriott, Hilton…
2. `repas` → décliné en `petit_dej`, `dejeuner`, `diner` selon l'heure
3. `taxi`, `bus`, `metro`, `train`
4. `autre`

Le logement est vérifié en premier pour éviter qu'une facture d'hôtel incluant un poste "petit-déjeuner" ne soit classée en repas.

**Quota Workers AI (plan gratuit) :** 10 000 neurons/jour.
**Plan Workers Paid (5 $/mois) :** facturation au dépassement à 0,011 $/1 000 neurons.
Suivi de consommation : `dash.cloudflare.com` → Workers & Pages → Vue d'ensemble → onglet **AI**.

## Installation

```bash
npm install
```

## Configuration des secrets

```bash
wrangler secret put JWT_SECRET
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
