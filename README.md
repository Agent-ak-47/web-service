# Project: Online Travel Agency (Web Service)

## 1. Project overview

* **Team:** 4 members
* **Domain:** E-commerce / Tourism & Travel
* **Main features:** management of packages, flights, excursions and a secure payment system.
* **Domain entities:** Package, Flight, Excursion, Reservation.
* **Tech stack & tools:** REST architecture, Docker for containerisation, Git / GitHub for versioning and branch-based deployment.

---

## 2. Task assignment and Git branches

To guarantee smooth collaborative work, each member or sub-group has a **dedicated branch**
to develop, test and merge (via Pull Request) their code into the main branch (`main` or `develop`).

| Member | Role / Feature | Associated entity | Dedicated Git branch |
| --- | --- | --- | --- |
| **Mohammed** | Flight management (REST API & services) | `Flight` | `mohammed` |
| **Youssef** | Travel package management | `Package` | `youssef` |
| **Kamal** | Reservations & payment | `Reservation` | `kamal` |
| **Marwan** | Excursion management & containerisation | `Excursion` | `marwan` |

---

## 3. Modelling of the main entities

### A. `Flight` entity (Mohammed)

* **Attributes:** `id`, `origin`, `destination`, `departureDate`, `arrivalDate`, `price`, `availableSeats`.
* **REST endpoints:**
* `GET /api/flights` : search for flights.
* `POST /api/flights` : add a flight (Admin).

### B. `Package` entity (Youssef)

* **Attributes:** `id`, `title`, `description`, `destination`, `totalPrice`, `startDate`, `endDate`.
* **REST endpoints:**
* `GET /api/packages` : list all available packages.
* `GET /api/packages/{id}` : display the details of a package.

### C. `Excursion` entity (Marwan)

* **Attributes:** `id`, `name`, `location`, `description`, `price`, `duration`.
* **REST endpoints:**
* `GET /api/excursions` : list the proposed excursions.

### D. `Reservation` & Payment entities (Kamal)

* **Attributes:** `id`, `userId`, `itemType` (Flight/Package/Excursion), `itemId`, `status`, `reservationDate`, `totalAmount`.
* **REST endpoints:**
* `POST /api/reservations` : create a reservation.
* `POST /api/payments` : process the secure payment.

---

## 4. DevOps strategy & Git workflow

### Branch workflow

1. **`main` / `master` :** stable, tested production code.
2. **`develop` :** integration branch that gathers all features.
3. **Feature branches (`feature/*`) :** each developer works exclusively on their dedicated branch (`feature/use-case-flight`, etc.) and pushes their code to deploy or test it in isolation.

### Docker & Docker Compose

Every service or the complete application is containerised with **Docker** to guarantee
uniform development and production environments:

* One `Dockerfile` per microservice / module.
* One `docker-compose.yml` orchestrating the web application, the database (e.g. PostgreSQL / MySQL) and the ancillary services.

---

## 5. Documentation & database

The full technical documentation is in **[`md/`](md/README.md)**: UML diagrams (Mermaid),
data model, REST API contract, sequence diagram, Docker architecture and Git workflow.

The shared MySQL database is already in place and running:

```bash
cp .env.example .env      # local configuration (never committed)
docker compose up -d      # starts MySQL 8.4 + phpMyAdmin
docker compose ps         # mysql must report "healthy"
```

| Database | MySQL account | Used by |
|----------|---------------|---------|
| `travel_agency` | `app_user` | all four services |

| Tables | Owner |
|--------|-------|
| `users`, `sessions` | Kamal |
| `flights`, `flight_seat_movements` | Mohammed |
| `packages`, `package_flights`, `package_excursions` | Youssef |
| `excursions`, `excursion_capacity_movements` | Marwan |
| `reservations`, `payments`, `reservation_history` | Kamal |

phpMyAdmin: <http://localhost:8080> — MySQL reachable on port **3307**.

> The whole project is in English: documentation, code comments, API routes, database
> tables and columns, JSON keys and status values.