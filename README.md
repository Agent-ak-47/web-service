# Projet : Agence de Voyage en Ligne (Web Service)

## 1. Vue d'ensemble du Projet

* **Équipe :** 8 
* **Domaine :** E-commerce / Tourisme & Voyage
* **Fonctionnalités principales :** Gestion des forfaits, vols, excursions et système de paiement sécurisé.
* **Entités du domaine :** Forfait, Vol, Excursion, Réservation.
* **Stack technique & Outils :** Architecture REST, Docker pour la conteneurisation, Git / GitHub pour le versioning et le déploiement par branches.

---

## 2. Répartition des Tâches et Branches Git

Pour garantir un travail collaboratif fluide, chaque membre ou sous-groupe dispose d'une **branche dédiée** pour développer, tester et fusionner (via Pull Request) son code vers la branche principale (`main` ou `develop`).

| Membre | Rôle / Fonctionnalité | Entité Associée | Branche Git Dédiée |
| --- | --- | --- | --- |
| **Mohammad** | Gestion des Vols (API REST & Services) | `Vol` | `mohammed` |
| **Youssef** | Gestion des Forfaits Touristiques | `Forfait` | `youssef` |
| **Kamal** | Gestion des Réservations & Paiement | `Réservation` | `kamal` |
| **Marwan** | Gestion des Excursions & Conteneurisation | `Excursion` | `marwan` |
---

## 3. Modélisation des Entités Principales

### A. Entité `Vol` (Mohammad)

* **Attributs :** `id`, `origine`, `destination`, `date_depart`, `date_arrivee`, `prix`, `places_disponibles`.
* **Endpoints REST :**
* `GET /api/vols` : Rechercher des vols.
* `POST /api/vols` : Ajouter un vol (Admin).



### B. Entité `Forfait` (Youssef)

* **Attributs :** `id`, `titre`, `description`, `destination`, `prix_total`, `date_debut`, `date_fin`.
* **Endpoints REST :**
* `GET /api/forfaits` : Lister tous les forfaits disponibles.
* `GET /api/forfaits/{id}` : Afficher les détails d'un forfait.



### C. Entité `Excursion` (Marwan)

* **Attributs :** `id`, `nom`, `lieu`, `description`, `tarif`, `duree`.
* **Endpoints REST :**
* `GET /api/excursions` : Lister les excursions proposées.



### D. Entité `Réservation` & Paiement (Kamal)

* **Attributs :** `id`, `utilisateur_id`, `type_item` (Vol/Forfait/Excursion), `item_id`, `statut`, `date_reservation`, `montant_total`.
* **Endpoints REST :**
* `POST /api/reservations` : Créer une réservation.
* `POST /api/paiement` : Traiter le paiement sécurisé.



---

## 4. Stratégie DevOps & Workflow Git

### Workflow des Branches

1. **`main` / `master` :** Code de production stable et testé.
2. **`develop` :** Branche d'intégration pour regrouper toutes les fonctionnalités.
3. **Branches de Fonctionnalités (`feature/*`) :** Chaque développeur travaille exclusivement sur sa branche dédiée (`feature/use-case-vol`, etc.) et pousse son code pour le déployer ou le tester en isolation.

### Docker & Docker Compose

Chaque service ou l'application complète sera conteneurisée via **Docker** pour garantir l'uniformité des environnements de développement et de production :

* Un fichier `Dockerfile` par microservice / module.
* Un fichier `docker-compose.yml` pour orchestrer l'application web, la base de données (ex. PostgreSQL / MySQL) et les services annexes.

