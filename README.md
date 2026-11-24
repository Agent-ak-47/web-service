# Agence de Voyage en Ligne — Architecture Distribuée & Web Services

Projet académique **Web Services (2026–2027)** réalisé sous l'encadrement du **Prof. Jaafar Idrais** (Équipe 8).

Ce dépôt contient une application distribuée d'agence de voyage en ligne composée de **six microservices REST hétérogènes**, d'un **frontend Angular** unique et d'une base de données **MySQL 8.4** partagée, le tout orchestré par **Docker Compose**.

---

## 👥 Équipe & Répartition des Services

| Membre | Service(s) | Port | Stack Technique | Responsabilité |
| :--- | :--- | :---: | :--- | :--- |
| **Kamal** | `user-service` | `8083` | Flask / Python 3.11 | Inscription, connexion, sessions JWT, profils |
| **Mohammed** | `flight-service` | `8081` | Node.js 20 / Express | Catalogue des vols, disponibilité, mouvements de sièges |
| **Youssef** | `package-service` | `8082` | Spring Boot 4 / Java 25 | Séjours composites, remises, calcul de disponibilité |
| **Marwan** | `excursion-service` | `8084` | Node.js 20 / Express | Catalogue des excursions, capacité, mouvements de places |
| **Kamal** | `reservation-service` | `8085` | Flask / Python 3.11 | Cycle de vie des réservations, orchestration du stock |
| **Kamal** | `payment-service` | `8086` | Flask / Python 3.11 | Paiement simulé, validation carte, remboursements |
| **Équipe** | `frontend` | `4200` | Angular 21 + Nginx | Interface publique client et portail d'administration |

---

## 🏗️ Architecture & Principes Clés

* **Hétérogénéité technologique :** Trois stacks backend (Python/Flask, Node.js/Express, Java/Spring Boot) unifiées autour d'un contrat REST JSON uniforme (`{"data": ...}` en succès, `{"error": ...}` en échec).
* **Propriété stricte des données :** La base physique `travel_agency` (12 tables InnoDB) est partagée, mais chaque service est l'unique écrivain de ses propres tables. Les communications inter-services passent exclusivement par HTTP sur le réseau interne `travel_agency_net`.
* **Cohérence transactionnelle & Compensation :**
  * Prix et libellés figés à la création de la réservation (`unit_price`, `total_amount`, `item_label`).
  * Verrous pessimistes (`SELECT ... FOR UPDATE`) et journalisation des mouvements de stock (`flight_seat_movements`, `excursion_capacity_movements`).
  * Mécanisme de compensation (`release`) si une étape de réservation échoue.
* **Sécurité :** Hachage des mots de passe en `PBKDF2-HMAC-SHA256` (100 000 itérations), jetons **JWT HS256** avec sessions révocables en base, contrôle d'accès par rôle (`CLIENT`, `ADMIN`) et minimisation des données bancaires (seuls les 4 derniers chiffres de la carte sont conservés).

---

## 📁 Structure du Dépôt

```text
.
├── docker-compose.yml       # Orchestration des 9 conteneurs (Frontend, 6 APIs, MySQL, phpMyAdmin)
├── .env.example             # Modèle des variables d'environnement
├── db/init/                 # Scripts SQL d'initialisation des 12 tables et jeu de données (90-seed.sql)
├── design/uml/              # Sources UMLet (.uxf) et diagrammes (composants, déploiement, séquence)
├── frontend/                # Application SPA Angular 21 et configuration Nginx durcie
├── kamal/                   # Services Flask (user, reservation, payment), mocks et smoke test
├── mohammed/backend/        # Service Vols (Node.js / Express)
├── marwan/backend/          # Service Excursions (Node.js / Express)
├── package-service/         # Service Séjours (Spring Boot / Java 25)
├── integration/             # Suite de 46 tests d'intégration bout-en-bout (Pytest)
└── quality/                 # Outils qualité (Coverage, Newman, JMeter, Selenium, OWASP ZAP, Snyk, Sonar)
```

---

## 🚀 Démarrage Rapide (Docker Compose)

### Prérequis
* **Docker Desktop** / **Docker Engine** avec **Docker Compose**
* Ports locaux disponibles : `4200`, `8080`, `8081`–`8086`, `3307`

### Lancement de la pile complète

1. **Configurer l'environnement :**
   ```bash
   cp .env.example .env
   ```
   *(Assurez-vous que `JWT_SECRET` contient au moins 32 caractères).*

2. **Construire et démarrer les 9 conteneurs :**
   ```bash
   docker compose up -d --build
   ```

3. **Vérifier l'état de santé des services :**
   ```bash
   docker compose ps
   ```

4. **Accéder aux interfaces :**
   * **Application Web (Frontend) :** `http://localhost:4200`
   * **Administration Base de Données (phpMyAdmin) :** `http://localhost:8080`
   * **MySQL (hôte) :** `localhost:3307` (Base : `travel_agency`)

### Commandes utiles d'exploitation
```bash
# Suivre les logs d'un service spécifique
docker compose logs -f reservation-service

# Arrêter la pile en conservant les données
docker compose down

# Réinitialisation complète (supprime les volumes et rejoue db/init/*.sql)
docker compose down -v && docker compose up -d --build
```

---

## 🔐 Comptes & Données de Démonstration

Le script `db/init/90-seed.sql` initialise automatiquement un catalogue de démonstration (16 vols, 15 excursions, 14 séjours) ainsi que deux comptes utilisateurs :

| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Administrateur** | `admin@agency.travel` | `Password123!` |
| **Client** | `client@agency.travel` | `Password123!` |

### Simulation de paiement par carte
* **Paiement accepté :** Tout numéro valide de 12 à 19 chiffres (ex. `4242 4242 4242 4242`, expiration future `12/28`, CVV `123`).
* **Paiement refusé (`402 PAYMENT_DECLINED`) :** Tout numéro se terminant par `0002` (ex. `4000 0000 0000 0002`).

---

## 🔌 Récapitulatif des API REST

Tous les montants sont exprimés en **MAD** et les dates suivent la norme **ISO 8601**. Les routes protégées requièrent l'en-tête `Authorization: Bearer <jeton>`.

### 1. Service Utilisateur (`http://localhost:8083`)
* `POST /api/auth/register` — Créer un compte client et ouvrir une session
* `POST /api/auth/login` — Authentifier un utilisateur et obtenir un JWT
* `POST /api/auth/logout` — Révoquer la session courante *(Client/Admin)*
* `GET /api/auth/me` — Consulter le profil courant *(Client/Admin)*
* `POST /api/auth/me` — Mettre à jour le profil *(Client/Admin)*

### 2. Service Vols (`http://localhost:8081`)
* `GET /api/flights` — Lister et filtrer les vols (`departureCity`, `arrivalCity`, `airline`, `minPrice`, `maxPrice`, `quantity`, `sortBy`, `order`)
* `GET /api/flights/{id}` — Détails d'un vol
* `GET /api/flights/{id}/availability` — Compteurs de places disponibles
* `POST /api/flights` | `PUT /api/flights/{id}` | `DELETE /api/flights/{id}` — Gestion du catalogue *(Admin)*

### 3. Service Séjours (`http://localhost:8082`)
* `GET /api/packages` — Liste paginée des séjours (`page`, `size`, `destination`, `withComposition`)
* `GET /api/packages/{id}` — Détails d'un séjour avec composition complète (vols + excursions)
* `GET /api/packages/{id}/availability` — Disponibilité calculée (minimum des composants)
* `POST /api/packages` | `PUT /api/packages/{id}` | `DELETE /api/packages/{id}` — Gestion des séjours *(Admin)*
* `POST /api/packages/{id}/flights` | `POST /api/packages/{id}/excursions` — Composer un séjour *(Admin)*

### 4. Service Excursions (`http://localhost:8084`)
* `GET /api/excursions` — Lister et filtrer les excursions (`location`, `date`, `fromDate`, `toDate`, `maxDuration`)
* `GET /api/excursions/{id}` — Détails d'une excursion
* `GET /api/excursions/{id}/availability` — Compteurs de places disponibles
* `POST /api/excursions` | `PUT /api/excursions/{id}` | `DELETE /api/excursions/{id}` — Gestion du catalogue *(Admin)*

### 5. Service Réservations (`http://localhost:8085`)
* `POST /api/reservations` — Créer une réservation (`FLIGHT`, `PACKAGE` ou `EXCURSION`) *(Client/Admin)*
* `GET /api/reservations` — Lister ses réservations (ou toutes pour un admin) *(Client/Admin)*
* `GET /api/reservations/{id}` — Consulter une réservation *(Client/Admin)*
* `PATCH /api/reservations/{id}` — Modifier la quantité d'une réservation `PENDING`/`CONFIRMED` *(Client/Admin)*
* `POST /api/reservations/{id}/cancellation` — Annuler une réservation (préavis de 2 jours pour un client) *(Client/Admin)*
* `POST /api/reservations/{id}/validation` — Valider une réservation `PENDING` $\rightarrow$ `CONFIRMED` *(Admin)*
* `GET /api/reservations/{id}/history` — Historique complet des changements de statut *(Client/Admin)*

### 6. Service Paiements (`http://localhost:8086`)
* `POST /api/reservations/{id}/payment` — Payer une réservation (`CARD`, `CASH`, `BANK_TRANSFER`, `PAYPAL`) *(Client/Admin)*
* `POST /api/reservations/{id}/refund` — Rembourser une réservation et libérer le stock *(Admin)*
* `POST /api/payments/{id}/refund` — Rembourser un paiement par son identifiant *(Admin)*

---

## 🧪 Tests & Qualité Logicielle

Le projet intègre **809 tests automatisés** ainsi qu'une suite de **46 tests d'intégration inter-services** sur la pile Docker complète :

```bash
# 1. Tests unitaires & API Python (318 tests - user, reservation, payment)
py -3.11 -m pytest kamal/user/tests kamal/reservation/tests kamal/payment/tests -q

# 2. Tests unitaires Node.js (60 tests - flight & excursion)
npm test --prefix mohammed/backend
npm test --prefix marwan/backend

# 3. Tests Java / Spring Boot (194 tests JUnit 5 - package-service)
./package-service/mvnw -f package-service/pom.xml test

# 4. Tests Frontend Angular (231 tests Vitest)
npm test --prefix frontend

# 5. Tests d'intégration bout-en-bout (nécessite docker compose up -d)
py -3.11 -m pytest integration -v
```

### Chaîne d'outils qualité (`quality/`)
* **Couverture de code :** `Coverage.py` (88% Flask), `JaCoCo` (90% Java), `Istanbul` (75,6% Angular)
* **Tests API, Charge & E2E :** `Postman / Newman` (48 requêtes), `Apache JMeter`, `Selenium`
* **Sécurité & Analyse statique :** `OWASP ZAP`, `Snyk`, `SonarQube`, `Checkstyle`
* **CI/CD :** GitHub Actions (`.github/workflows/quality.yml`)

---

## 📄 Documentation Complète

Pour plus de détails sur les diagrammes UML, le schéma relationnel complet des 12 tables, les codes d'erreur HTTP et les procédures de dépannage, consultez le **Document d'Architecture Technique (DAT v1.1)** : `MIL3_DAT_EQUIPE_8.pdf`.
