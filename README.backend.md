# Roulii Backend (NestJS)

## Scope backend livre

- Base NestJS modulaire: auth, users, vehicles, trips, bookings, payments, wallet, ratings, messages, notifications, admin.
- Base NestJS modulaire: auth, users, vehicles, trips, bookings, payments, wallet, ratings, messages, notifications, admin, tracking GPS.
- Configuration environnement validee via Joi.
- Prisma schema complet avec migrations SQL initiales.
- OTP par telephone (Twilio), JWT access/refresh, refresh/logout, guard JWT global.
- OTP par telephone (Twilio), JWT access/refresh, refresh/logout, guard JWT global.
- Parcours cash: booking card/cash, acceptation chauffeur, verification wallet, blocage commission, capture en fin de trajet.
- Wallet: solde, montant bloque, solde retirable, recharge, retrait bancaire (seuil 10 EUR).
- Amendes: annulation tardive (<10 min), penalite 20%, repartition 70% plateforme / 30% wallet chauffeur.
- Notifications: push Firebase + SMS Twilio + email SMTP (mode mock si non configure).
- Monitoring: endpoint readiness (/api/v1/health/readiness) avec statut DB/Redis/providers.
- Observabilite: logs HTTP structures JSON + request id + filtre global d erreurs.
- Hardening: rate limits par endpoint sensible (auth, paiements, bookings, wallet, tracking).
- Production safety: providers externes (Stripe/Firebase/Twilio/SMTP) en fail-fast si non configures.
- Endpoints users: me/public profile/update/anonymisation RGPD, token FCM.
- Docker compose local: PostgreSQL + Redis.
- Swagger: /docs.
- Qualite: ESLint, Prettier, Husky pre-commit, lint-staged.

## Branching backend

- Branch de travail backend: feature/backend-auth
- Base d integration: main (repo actuel)

## Lancer local

1. Installer dependances:
   npm install
2. Copier variables:
   copy .env.example .env
3. Lancer DB et Redis (si Docker disponible):
   docker compose up -d
4. Prisma client + migration:
   npm run prisma:generate
   npm run prisma:migrate:dev
5. Demarrer l API:
   npm run start:dev

## Lancer sans DB pour test health/Postman

- Option utile si PostgreSQL n est pas disponible localement.
- Commande PowerShell:
  $env:SKIP_DB_CONNECT="true"; npm run start

## Tests

- Unitaires: npm test
- E2E: npm run test:e2e
- Build: npm run build

## Test Postman/Newman

Collection fournie: postman/roulii-backend.postman_collection.json

Execution:

1. Demarrer API (sans DB si necessaire):
   $env:SKIP_DB_CONNECT="true"; npm run start
2. Dans un autre terminal:
   npx newman run postman/roulii-backend.postman_collection.json --env-var baseUrl=http://localhost:3000

Le test valide GET /api/v1/health et la structure de reponse attendue.

## Nouveaux endpoints metier

- Bookings:
  - POST /api/v1/bookings (champ paymentMethod: CARD|CASH)
  - POST /api/v1/bookings/:id/driver-action
  - POST /api/v1/bookings/:id/complete
- Wallet:
  - POST /api/v1/wallet/recharge
  - POST /api/v1/wallet/withdrawals
- Tracking:
  - POST /api/v1/tracking/bookings/:bookingId/position
  - GET /api/v1/tracking/bookings/:bookingId/position
