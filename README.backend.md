# Roulii Backend (NestJS)

## Scope backend livre

- Base NestJS modulaire: auth, users, vehicles, trips, bookings, payments, wallet, ratings, messages, notifications, admin.
- Configuration environnement validee via Joi.
- Prisma schema complet avec migrations SQL initiales.
- OTP par telephone (Twilio), JWT access/refresh, refresh/logout, guard JWT global.
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
