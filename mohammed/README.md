# Service de Gestion des Vols (Flight Management Service) — Mohammed

Dossier de travail pour **Mohammed**. 
* **Rôle :** Flight management (REST API & services)
* **Branche Git dédiée :** `mohammed`
* **Entité métier associée :** `Flight`
* **Tables gérées :** `flights`, `flight_seat_movements` (définies dans [`db/init/20-flight.sql`](../db/init/20-flight.sql))
* **Port HTTP de service :** **`8081`**
* **Dossier des Spécifications Fonctionnelles Détaillées :** [`DOSSIER_SPECIFICATIONS_FONCTIONNELLES.md`](./DOSSIER_SPECIFICATIONS_FONCTIONNELLES.md)
* **Dossier de tests unitaires formel :** [`DOSSIER_TESTS_UNITAIRES.md`](./DOSSIER_TESTS_UNITAIRES.md)

---

## Sommaire

1. [Présentation et Rôle du Service](#1-présentation-et-rôle-du-service)
2. [Architecture Technique & Structure du Code](#2-architecture-technique--structure-du-code)
3. [Modélisation Base de Données & Entités](#3-modélisation-base-de-données--entités)
4. [Contrat REST API & Spécification des Endpoints](#4-contrat-rest-api--spécification-des-endpoints)
5. [Dossier des Tests Unitaires & Résultats (30 Tests)](#5-dossier-des-tests-unitaires--résultats-30-tests)
6. [Guide de Démarrage (Local & Docker)](#6-guide-de-démarrage-local--docker)
7. [Intégrations Inter-Services & Frontend](#7-intégrations-inter-services--frontend)
8. [Règles Métier & Précautions Essentielles](#8-règles-métier--précautions-essentielles)

---

## 1. Présentation et Rôle du Service

Au sein du projet d'Agence de Voyage en ligne (**Atlas Trips**), le service de gestion des vols conçu par **Mohammed** a pour responsabilité principale :
* La publication et la consultation du catalogue de vols pour les voyageurs.
* La recherche multicritère optimisée (villes de départ et d'arrivée, dates, prix max, nombre de places).
* L'administration sécurisée des vols (création, mise à jour, suppression) réservée aux administrateurs (rôle `ADMIN` vérifié par JWT).
* La gestion des stocks de places et la réservation atomique de sièges pour le service de Réservation de Kamal.
* La consignation de tous les mouvements de capacité dans un journal d'audit (`flight_seat_movements`).

### Matrice des fonctionnalités

| # | Fonctionnalité | Route HTTP | Rôle / Accès |
|---|---|---|---|
| **R1** | Consultation du catalogue de vols | `GET /api/flights` | Public |
| **R2** | Recherche et filtres multicritères | `GET /api/flights?departureCity=…&arrivalCity=…` | Public |
| **R3** | Fiche détail d'un vol par identifiant | `GET /api/flights/:id` | Public |
| **R4** | Vérification de disponibilité des sièges | `GET /api/flights/:id/availability` | Public |
| **R5** | Création d'un nouveau vol | `POST /api/flights` | Admin (JWT) |
| **R6** | Modification d'un vol existant | `PUT /api/flights/:id` et `POST /api/flights/:id` | Admin (JWT) |
| **R7** | Suppression d'un vol | `DELETE /api/flights/:id` | Admin (JWT) |
| **R8** | Réservation atomique de places | `POST /api/internal/flights/:id/reserve` | Inter-service (Kamal) |
| **R9** | Libération de places (annulation) | `POST /api/internal/flights/:id/release` | Inter-service (Kamal) |
| **R10**| Sonde d'état et de santé | `GET /health` | Public |

---

## 2. Architecture Technique & Structure du Code

Le service est développé en **JavaScript moderne (Node.js 20+ avec ES Modules natifs)**. L'architecture suit une séparation stricte des responsabilités (couches Controller, Service, Domain, Middleware, Utils).

```
mohammed/
├── backend/                         # Code source du backend Node.js (port 8081)
│   ├── src/
│   │   ├── server.js                # Point d'entrée HTTP (écoute sur le port configuré)
│   │   ├── app.js                   # Configuration Express (CORS, JSON, routes, gestionnaire d'erreurs)
│   │   ├── config.js                # Variables d'environnement & valeurs de repli
│   │   ├── db.js                    # Pool de connexions MySQL2 (database: travel_agency)
│   │   ├── middleware/
│   │   │   └── auth.js              # Middleware JWT vérifiant le rôle ADMIN (Kamal)
│   │   ├── controllers/
│   │   │   └── flights.js           # Contrôleur HTTP : parsing requêtes, dispatch & réponses
│   │   ├── domain/
│   │   │   └── flight.js            # Domaine pur : validations, règles métier (sans dépendance I/O)
│   │   ├── services/
│   │   │   └── flights.js           # Accès aux données MySQL, transactions InnoDB atomiques
│   │   ├── routes/
│   │   │   ├── flights.js           # Routes publiques et administratives (/api/flights)
│   │   │   └── internal.js          # Routes inter-services (/api/internal/flights)
│   │   └── utils/
│   │       ├── asyncHandler.js      # Wrapper asynchrone évitant les try/catch verbeux
│   │       ├── response.js          # Enveloppes standardisées ok() et fail()
│   │       ├── serialize.js         # Mapping de la ligne SQL (snake_case) vers le JSON (camelCase)
│   │       └── validate.js          # Utilitaires de conversion et validation de types
│   ├── tests/                       # Suite de tests unitaires automatisés (Node Test Runner)
│   │   ├── flight.domain.test.js    # 16 tests unitaires des règles métier et validations (UT-FLI-01 à 16)
│   │   ├── flight.service.test.js   # 5 tests unitaires du dépôt en mémoire et transactions (UT-FLI-26 à 30)
│   │   ├── serialize.test.js        # 3 tests unitaires de transformation et dates (UT-FLI-17 à 19)
│   │   └── validate.test.js         # 6 tests unitaires des fonctions utilitaires (UT-FLI-20 à 25)
│   ├── Dockerfile                   # Image Docker de production (non-root node, healthcheck)
│   ├── .dockerignore
│   ├── package.json                 # Dépendances (express, mysql2, jsonwebtoken, cors, dotenv)
│   └── .env.example                 # Modèle de variables pour le développement local
├── docker-compose.yml               # Déploiement conteneurisé du service vol
├── .env.example                     # Modèle de variables pour Docker Compose
├── DOSSIER_TESTS_UNITAIRES.md       # Dossier formel de tests unitaires
└── README.md                        # Documentation complète du service
```

---

## 3. Modélisation Base de Données & Entités

Conformément à la convention du projet (« *Une donnée, un seul propriétaire* »), Mohammed détient et gère exclusivement les tables définies dans [`db/init/20-flight.sql`](../db/init/20-flight.sql).

### Table `flights`

```sql
CREATE TABLE IF NOT EXISTS flights (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    airline            VARCHAR(80)     NOT NULL,
    flight_number      VARCHAR(12)     NOT NULL,
    departure_city     VARCHAR(80)     NOT NULL,
    arrival_city       VARCHAR(80)     NOT NULL,
    departure_time     DATETIME        NOT NULL,
    arrival_time       DATETIME        NOT NULL,
    total_seats        INT UNSIGNED    NOT NULL DEFAULT 0,
    available_seats    INT UNSIGNED    NOT NULL DEFAULT 0,
    price              DECIMAL(10,2)   NOT NULL,
    active             TINYINT(1)      NOT NULL DEFAULT 1,
    image_url          VARCHAR(255)    NULL,
    created_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_flights_number_departure (flight_number, departure_time),
    KEY idx_flights_search (departure_city, arrival_city, departure_time),
    KEY idx_flights_price (price),
    CONSTRAINT ck_flights_seats  CHECK (available_seats <= total_seats),
    CONSTRAINT ck_flights_price  CHECK (price >= 0),
    CONSTRAINT ck_flights_dates  CHECK (arrival_time > departure_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
```

### Table `flight_seat_movements` (Journal de capacité)

```sql
CREATE TABLE IF NOT EXISTS flight_seat_movements (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    flight_id      BIGINT UNSIGNED NOT NULL,
    reservation_id BIGINT UNSIGNED NULL,
    delta          INT             NOT NULL COMMENT '-1 réservé, +1 libéré',
    reason         ENUM('RESERVATION','RELEASE','ADMIN') NOT NULL,
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_seat_movements_flight (flight_id, created_at),
    CONSTRAINT fk_seat_movements_flight
        FOREIGN KEY (flight_id) REFERENCES flights (id)
        ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
```

---

## 4. Contrat REST API & Spécification des Endpoints

### 4.1 Enveloppes de réponse standardisées

Toutes les réponses de l'API suivent l'architecture définie dans le projet :

* **Succès :**
  ```json
  {
    "data": { ... }
  }
  ```
* **Erreur contrôlée :**
  ```json
  {
    "error": {
      "code": "INSUFFICIENT_AVAILABILITY",
      "message": "Only 2 place(s) are left for this flight.",
      "details": {
        "itemId": 1,
        "requested": 5,
        "available": 2
      }
    }
  }
  ```

### 4.2 Recherche de vols (`GET /api/flights`)

Paramètres de requête supportés :
* `departureCity` : Filtrer par ville de départ (recherche partielle `LIKE`).
* `arrivalCity` : Filtrer par ville d'arrivée (recherche partielle `LIKE`).
* `airline` : Filtrer par compagnie aérienne.
* `departureDate` : Filtrer par date de départ (`YYYY-MM-DD`).
* `arrivalDate` : Filtrer par date d'arrivée (`YYYY-MM-DD`).
* `minPrice` / `maxPrice` : Filtrer par tranche de prix unitaire.
* `quantity` (ou `minSeats`) : Filtrer les vols ayant au moins `X` places disponibles.
* `search` : Recherche globale sur la compagnie, le numéro de vol ou les villes.
* `sortBy` : Tri (`departureTime`, `arrivalTime`, `price`, `airline`, `flightNumber`, `availableSeats`, `totalSeats`).
* `order` : `asc` (croissant) ou `desc` (décroissant).

### 4.3 Réservation de places (`POST /api/internal/flights/:id/reserve`)

Utilisé par le service de Réservation de Kamal :
* **Corps de la requête :**
  ```json
  {
    "quantity": 2,
    "reservationId": 105
  }
  ```
* **Code retour HTTP :**
  * `200 OK` : Réservation confirmée, places décrémentées, mouvement consigné.
  * `409 Conflict` : `INSUFFICIENT_AVAILABILITY` si le vol est inactif ou s'il n'y a pas assez de places.
  * `404 Not Found` : Le vol demandé n'existe pas.

---

## 5. Dossier des Tests Unitaires & Résultats (30 Tests)

Le dossier officiel complet est consigné dans [`DOSSIER_TESTS_UNITAIRES.md`](./DOSSIER_TESTS_UNITAIRES.md).
Tous les tests sont codés avec le **test runner natif de Node.js (`node:test`)** et les assertions strictes (`node:assert/strict`), sans nécessiter de bibliothèque externe ni de base de données MySQL active.

### 5.1 Exemple de test unitaire (Arrange - Act - Assert)

```javascript
test('UT-FLI-07: validateFlight - règle de gestion (rejet si availableSeats > totalSeats)', () => {
  // 1. Arrange (Préparation de données invalides)
  const input = {
    airline: 'Royal Air Maroc',
    flightNumber: 'RAM101',
    departureCity: 'Casablanca',
    arrivalCity: 'Paris',
    departureTime: '2026-06-01 08:00:00',
    arrivalTime: '2026-06-01 11:00:00',
    totalSeats: '100',
    availableSeats: '150', // Dépassement volontaire
    price: '2450.00',
  };

  // 2. Act (Exécution de la méthode métier)
  const result = validateFlight(input);

  // 3. Assert (Vérification de l'erreur 422 BUSINESS_RULE_VIOLATION)
  assert.equal(result.data, undefined);
  assert.equal(result.error.code, 'BUSINESS_RULE_VIOLATION');
  assert.equal(result.error.status, 422);
});
```

### 5.2 Tableau synthétique des 30 tests unitaires

| Identifiant | Unité / Fonction | Scénario testé | Statut |
| :--- | :--- | :--- | :---: |
| **UT-FLI-01** | `validateFlight` | Cas nominal : conversions chaînes en nombres et dates | ☑ Réussi |
| **UT-FLI-02** | `validateFlight` | Cas limite : dates seules YYYY-MM-DD avec heures par défaut | ☑ Réussi |
| **UT-FLI-03** | `validateFlight` | Cas limite : 0 places disponibles et prix à 0 MAD | ☑ Réussi |
| **UT-FLI-04** | `validateFlight` | Rejet si la compagnie aérienne est absente | ☑ Réussi |
| **UT-FLI-05** | `validateFlight` | Rejet si le numéro de vol est absent ou vide | ☑ Réussi |
| **UT-FLI-06** | `validateFlight` | Rejet si la ville de départ ou arrivée est absente | ☑ Réussi |
| **UT-FLI-07** | `validateFlight` | Règle de gestion : rejet si `availableSeats > totalSeats` | ☑ Réussi |
| **UT-FLI-08** | `validateFlight` | Règle de gestion : rejet si `arrivalTime <= departureTime` | ☑ Réussi |
| **UT-FLI-09** | `validateFlight` | Rejet si le prix est manquant ou invalide | ☑ Réussi |
| **UT-FLI-10** | `validateFlight` | Rejet si les sièges totaux sont non entiers ou `<= 0` | ☑ Réussi |
| **UT-FLI-11** | `checkReserveAvailability` | Cas nominal : réservation autorisée si places suffisantes | ☑ Réussi |
| **UT-FLI-12** | `checkReserveAvailability` | Cas limite : quantité demandée égale au stock restant | ☑ Réussi |
| **UT-FLI-13** | `checkReserveAvailability` | Rejet 409 si le vol est inactif (`active = false`) | ☑ Réussi |
| **UT-FLI-14** | `checkReserveAvailability` | Rejet 409 si la demande dépasse les places libres | ☑ Réussi |
| **UT-FLI-15** | `availabilityAfterRelease` | Cas nominal : incrémentation des places libérées | ☑ Réussi |
| **UT-FLI-16** | `availabilityAfterRelease` | Cas limite : plafonnement strict à `totalSeats` | ☑ Réussi |
| **UT-FLI-17** | `formatIso` | Normalisation de la date SQL vers le format ISO avec 'T' | ☑ Réussi |
| **UT-FLI-18** | `flightJson` | Sérialisation de la ligne SQL vers le contrat `KzFlight` | ☑ Réussi |
| **UT-FLI-19** | `availabilityJson` | Formatage du contrat de disponibilité `{ id, availableSeats, totalSeats }` | ☑ Réussi |
| **UT-FLI-20** | `asPositiveInt` | Acceptation d'entiers > 0 et rejet des valeurs invalides | ☑ Réussi |
| **UT-FLI-21** | `asNonNegativeInt` | Acceptation de 0 et des entiers positifs | ☑ Réussi |
| **UT-FLI-22** | `asPrice` | Arrondi bancaire à 2 décimales, rejet des prix négatifs | ☑ Réussi |
| **UT-FLI-23** | `asDate` & `asDateTime` | Validation et formatage strict des dates | ☑ Réussi |
| **UT-FLI-24** | `asBoolean` | Cast robuste des chaînes, nombres et booléens | ☑ Réussi |
| **UT-FLI-25** | `asText` | Troncature automatique des chaînes selon la taille SQL | ☑ Réussi |
| **UT-FLI-26** | `InMemoryFlightRepository` | Ajout d'un vol et recherche par ID en mémoire | ☑ Réussi |
| **UT-FLI-27** | `InMemoryFlightRepository` | Unicité du vol (numéro + date) sans base MySQL | ☑ Réussi |
| **UT-FLI-28** | `InMemoryFlightRepository` | Réservation atomique et création du mouvement journalisé | ☑ Réussi |
| **UT-FLI-29** | `InMemoryFlightRepository` | Rejet 409 en cas de surréservation | ☑ Réussi |
| **UT-FLI-30** | `InMemoryFlightRepository` | Libération de places et consignation dans le journal | ☑ Réussi |

### 5.3 Bilan d'exécution

```
ℹ tests 30
ℹ suites 0
ℹ pass 30
ℹ fail 0
ℹ duration_ms ~220ms
```
**Taux de succès : 100% (0 anomalies détectées).**

---

## 6. Guide de Démarrage (Local & Docker)

### 6.1 Lancement local avec Node.js

```bash
# 1. Aller dans le dossier backend de Mohammed
cd mohammed/backend

# 2. Configurer les variables d'environnement locales
cp .env.example .env

# 3. Installer les dépendances
npm install

# 4. Lancer les 30 tests unitaires
npm test

# 5. Démarrer le serveur HTTP
npm start
```
Le service est disponible sur : **`http://localhost:8081`**.
Vérification : `curl http://localhost:8081/health`.

### 6.2 Lancement conteneurisé avec Docker Compose

```bash
# 1. Démarrer la base de données partagée à la racine du projet
docker compose up -d

# 2. Démarrer le service de vol dans son conteneur
cp mohammed/.env.example mohammed/.env
docker compose -f mohammed/docker-compose.yml up -d --build
docker compose -f mohammed/docker-compose.yml ps
```

---

## 7. Intégrations Inter-Services & Frontend

* **Service Réservation (Kamal - port 8085) :** Réserve et libère les places lors du parcours de paiement via `POST /api/internal/flights/:id/reserve` et `release`.
* **Service Packages (Youssef - port 8082) :** Compose les offres de voyage en intégrant les vols via `GET /api/flights/:id`.
* **Frontend Angular (port 4200) :** Connecté via `FLIGHT_SERVICE_URL = 'http://localhost:8081'` dans `global.service.ts` :
  * Page publique des vols : `/flights` et `/flights/:id`.
  * Page d'administration des vols : `/admin/flights` et formulaire `/admin/flights/form`.

---

## 8. Règles Métier & Précautions Essentielles

1. **Isolation des tables :** Ne jamais effectuer de requêtes SQL directes sur les tables des autres membres (`packages`, `excursions`, `reservations`, `users`).
2. **Transactions atomiques :** Toute réservation ou libération de places s'exécute dans une transaction InnoDB avec verrouillage `SELECT ... FOR UPDATE` pour prévenir les concurrences d'accès (race conditions).
3. **Double support PUT / POST pour les mises à jour :** Le formulaire admin Angular met à jour les entités via `POST /api/flights/:id`. L'API supporte à la fois `PUT` et `POST` pour garantir une compatibilité totale.
4. **Dates au format standard :** Les dates sont sérialisées avec séparateur `'T'` pour permettre à l'Angular DatePipe d'afficher les horaires sans erreur de conversion.
