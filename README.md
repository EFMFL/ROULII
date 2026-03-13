# ROULII

Application mobile de covoiturage **iOS & Android** pour le marché français.

- **Lancement cible** : **août 2026**
- **Distance cible** : trajets courts à moyens (**30–180 km**)
- **Positionnement** : fiabilité, responsabilisation, réduction des annulations tardives

> Repo de travail commun. **EFMFL = backend**, **Manuella = frontend (Flutter)**.

---

## Sommaire

- [Vision & différenciation](#vision--différenciation)
- [Périmètre MVP](#périmètre-mvp)
- [Règles métier (à respecter)](#règles-métier-à-respecter)
- [Stack technique](#stack-technique)
- [Architecture (proposée)](#architecture-proposée)
- [Modèle de données (tables MVP)](#modèle-de-données-tables-mvp)
- [API (grandes lignes)](#api-grandes-lignes)
- [Sprints & responsabilités](#sprints--responsabilités)
- [Qualité, sécurité & RGPD](#qualité-sécurité--rgpd)
- [Déploiement (cible)](#déploiement-cible)
- [Contribuer](#contribuer)

---

## Vision & différenciation

ROULII est une app de covoiturage conçue pour réduire fortement les **annulations tardives** et augmenter la **fiabilité** des trajets :

- **Prix fixe transparent** : `0,60 € / km`
- **Commission incluse** dans le prix affiché
- **Pénalité automatique** en cas d’annulation ≤ 10 min avant départ

---

## Périmètre MVP

- **Mobile uniquement** (pas de web)
- Recherche + réservation + paiement
- Création de trajets conducteur
- Wallet conducteur (gains, historique, demande de virement)
- Messagerie in-app (après réservation)
- Appel audio in-app (numéros masqués)
- Score de fiabilité
- Admin panel minimum (listes + gestion annulations/pénalités)

### Hors MVP

- Abonnements
- Tarification dynamique
- Parrainage
- Assurance intégrée
- Apple Pay / Google Pay
- Version web

---

## Règles métier (à respecter)

### 1) Tarification & commission (backend only)

- `price_total = distance_km × 0.60`
- `commission = price_total × 0.240878`
- `driver_amount = price_total - commission`

> Tous les calculs (distance, prix, commission, pénalité) doivent être **calculés côté backend**.

### 2) Politique d’annulation

- Annulation **> 10 min** avant départ → **gratuite**
- Annulation **≤ 10 min** avant départ → **pénalité = 10 %** du `price_total`

**Répartition pénalité** :

- `80 %` → ROULII
- `20 %` → partie impactée

La pénalité est prélevée automatiquement via **Stripe**.

**Exceptions** (traitées manuellement côté admin) :

- force majeure
- bug technique

### 3) Messagerie / Appel

- Disponibles **uniquement après réservation**
- Désactivés **après le trajet**
- Appels **anonymisés** (aucun numéro visible)

---

## Stack technique

### Frontend (Manuella)

- Flutter (iOS + Android)
- Firebase Cloud Messaging (notifications)

### Backend (EFMFL)

- Node.js – **NestJS recommandé**
- PostgreSQL
- Stripe (paiements + pénalités)
- Twilio **ou** WebRTC (appel audio anonymisé)
- Hébergement : AWS ou Google Cloud **en Europe**

---

## Architecture (proposée)

> À adapter quand le code arrivera. Objectif : découper clairement mobile / API / DB.

- **mobile/** : app Flutter
- **backend/** : API NestJS
- **infra/** : scripts IaC / notes de déploiement (optionnel)
- **docs/** : schémas, décisions, specs

---

## Modèle de données (tables MVP)

Tables requises (UUID partout) :

- `users`
- `vehicles`
- `trips`
- `bookings`
- `payments`
- `wallet_transactions`
- `ratings`
- `cancellation_logs`
- `messages`

### Relations (résumé)

- Un `user` peut être conducteur et/ou passager
- Un `trip` appartient à un conducteur (`user_id`)
- Une `booking` lie un passager (`user_id`) à un `trip`
- Un `payment` est lié à une `booking`
- Une `wallet_transaction` est liée à un conducteur (`user_id`) et à une origine (`trip`, `booking`, `penalty`, etc.)

---

## API (grandes lignes)

> Documenter avec OpenAPI/Swagger dès que possible.

### Auth

- `POST /auth/start` (phone → envoi OTP)
- `POST /auth/verify` (OTP → JWT)

### Recherche & trajets

- `GET /trips/search`
- `GET /trips/:id`
- `POST /trips` (conducteur)
- `GET /me/trips` (à venir / passés)
- `POST /trips/:id/cancel`

### Réservations & paiement

- `POST /bookings` (réservation + paiement requis)
- `GET /me/bookings`

### Wallet

- `GET /me/wallet`
- `POST /me/wallet/payout-request`

### Messagerie

- `GET /bookings/:id/messages`
- `POST /bookings/:id/messages`

---

## Sprints & responsabilités

### Répartition

- **Backend (EFMFL)** : DB + API + règles métier + Stripe + sécurité + admin minimum
- **Frontend (Manuella)** : Flutter UI/UX + navigation + intégration API + paiements + FCM

### Jalons (suggestion)

- **Sprint 0 (mars 2026)** : setup repo, conventions, CI, choix services (Stripe/Twilio)
- **Sprint 1** : Auth + Users + Trips (create/search/detail)
- **Sprint 2** : Bookings + Paiement Stripe + Annulations + pénalités
- **Sprint 3** : Wallet + Ratings + Score fiabilité
- **Sprint 4** : Messages + Appel in-app
- **Sprint 5** : Admin minimum + hardening + tests

> Lancement cible : **août 2026**.

---

## Qualité, sécurité & RGPD

- Hébergement **en Europe**
- Mots de passe/champs sensibles chiffrés quand applicable (bcrypt pour secrets)
- JWT sécurisé
- Logs limités (minimisation)
- Droit à l’effacement
- Protection double réservation
- Validation conflits horaires

---

## Déploiement (cible)

- DB : PostgreSQL managé (AWS RDS ou Cloud SQL)
- Backend : container (Docker) + déploiement (ECS/Fargate ou Cloud Run)
- Stockage média (photos) : bucket (S3/GCS)
- Secrets : Secret Manager

---

## Contribuer

1. Créer une branche : `feat/<topic>` ou `fix/<topic>`
2. Petits commits clairs
3. PR avec description (quoi/pourquoi/comment tester)

### Conventions

- Une source de vérité : **backend** pour prix/commission/pénalités
- Ne jamais permettre au mobile de "forcer" un prix
- Toujours valider les transitions d’état (trip, booking, paiement)

---

## Contacts

- Backend : **@EFMFL**
- Frontend : **Manuella**
