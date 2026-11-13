# DOSSIER DE TESTS UNITAIRES
## Application Online Travel Agency — Service de Gestion des Vols (Flight Management)

---

### Fiche d'identification du document

| Élément | Valeur |
| :--- | :--- |
| **Nom du projet** | Online Travel Agency (Web Service) |
| **Module / Composant** | Service de Gestion des Vols (Flight Service) |
| **Référence du document** | TU-FLI-001 |
| **Version du document** | 1.0 |
| **Date de création** | 13/11/2026 |
| **Responsable des tests** | Mohammed (Développeur & Testeur module Vol) |
| **Équipe de développement** | Mohammed, Kamal, Youssef, Marwan |
| **Statut** | ☑ Validé |

---

### 1. Historique des versions et des intervenants

Toute création ou modification de ce dossier est enregistrée ci-dessous :

| Version | Date | Intervenant (nom) | Rôle / fonction | Nature de l'intervention et modifications | Validation |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **0.1** | 13/11/2026 | Mohammed | Rédacteur | Définition du périmètre de test, identification des entités et règles métier | Validé |
| **0.2** | 13/11/2026 | Mohammed | Développeur | Implémentation des 30 cas de test unitaires sous Node.js (`node:test`, `assert/strict`) | Validé |
| **0.3** | 13/11/2026 | Mohammed | Testeur | Exécution de la suite automatisée, capture des temps et résultats d'exécution | Validé |
| **1.0** | 13/11/2026 | Mohammed | Responsable module | Finalisation du bilan, validation des 30 tests (100% de réussite) | Validé |

---

### 2. Objet et objectifs

Ce dossier décrit les **tests unitaires** réalisés sur le **Service de Gestion des Vols** (développé en **Node.js/Express** avec ES Modules).
Il permet de vérifier le comportement de chaque unité de code indépendamment des autres composants et de la base de données :

1. **Vérifier le respect des règles métier** : capacité des sièges, chronologie départ/arrivée, tarification positive, intégrité transactionnelle.
2. **Détecter les régressions et anomalies au plus tôt**, avant les phases d'intégration avec les services de Kamal (Réservation) et Youssef (Packages).
3. **Conserver une trace formelle** des scénarios de test, préconditions, données d'entrée, résultats attendus et obtenus.
4. **Permettre la non-régression continue** : relance instantanée des tests à chaque `git push` via `npm test` (`node --test`).

---

### 3. Présentation simplifiée de l'entité `Flight`

Dans le cadre du service de gestion des vols, l'entité principale `Flight` est modélisée comme suit :

| Attribut | Type indicatif | Règle / description métier |
| :--- | :--- | :--- |
| `id` | Entier (Long) | Identifiant unique généré par la base de données (`BIGINT UNSIGNED AUTO_INCREMENT`) |
| `airline` | Chaîne (max 80) | Nom de la compagnie aérienne (obligatoire, non vide) |
| `flightNumber` | Chaîne (max 12) | Numéro de vol unique combiné à l'heure de départ (obligatoire) |
| `departureCity` | Chaîne (max 80) | Ville de départ (obligatoire) |
| `arrivalCity` | Chaîne (max 80) | Ville de destination (obligatoire) |
| `departureTime` | Date / Heure | Date et heure de départ (format ISO `YYYY-MM-DDTHH:mm:ss`, obligatoire) |
| `arrivalTime` | Date / Heure | Date et heure d'arrivée (strictement postérieure à `departureTime`) |
| `totalSeats` | Entier positif | Nombre total de sièges de l'appareil (`> 0`) |
| `availableSeats` | Entier non négatif | Sièges actuellement disponibles à la vente (`0 <= availableSeats <= totalSeats`) |
| `price` | Décimal (2 déc.) | Prix unitaire par passager en MAD (`price >= 0.00`) |
| `active` | Booléen | Statut de disponibilité du vol au catalogue (défaut `true`) |
| `imageUrl` | Chaîne (max 255) | Lien ou chemin relatif vers l'image de couverture du vol |

**Fonctionnalités testées :**
* Validation et normalisation des données lors de l'ajout ou modification d'un vol.
* Contrôle de disponibilité (`checkReserveAvailability`) et blocage en cas de surréservation ou vol inactif.
* Décrémentation atomique des sièges et consignation dans le journal `flight_seat_movements`.
* Libération de sièges (`availabilityAfterRelease`) avec plafonnement automatique à la capacité totale.
* Sérialisation vers le contrat JSON camelCase attendu par le frontend Angular.
* Parsing robuste des filtres de recherche et des types de données.

---

### 4. Périmètre & unités testées

| ID | Classe / Module | Méthode ou fonctionnalité | Comportement attendu |
| :--- | :--- | :--- | :--- |
| **UT-FLI-01 à UT-FLI-10** | `domain/flight.js` | `validateFlight(body)` | Normaliser et valider la structure et les contraintes métier d'un vol |
| **UT-FLI-11 à UT-FLI-14** | `domain/flight.js` | `checkReserveAvailability(flight, qty)` | Autoriser ou refuser la réservation de places selon l'état et le stock |
| **UT-FLI-15 à UT-FLI-16** | `domain/flight.js` | `availabilityAfterRelease(flight, qty)` | Calculer le nouveau stock de places après annulation sans dépasser le total |
| **UT-FLI-17 à UT-FLI-19** | `utils/serialize.js` | `flightJson()`, `availabilityJson()` | Transformer les enregistrements SQL en enveloppe JSON conforme |
| **UT-FLI-20 à UT-FLI-25** | `utils/validate.js` | `asPositiveInt`, `asPrice`, `asDateTime`, etc. | Assurer le cast sécurisé des paramètres reçus du client |
| **UT-FLI-26 à UT-FLI-30** | `tests/flight.service.test.js` | `InMemoryFlightRepository` | Valider le cycle de vie complet (CRUD, transaction, journal) en mémoire sans MySQL |

---

### 5. Exemple détaillé : Réservation d'un vol (Arrange – Act – Assert)

#### 5.1 Règle métier
Lors d'une tentative de réservation par le service de Réservation (Kamal), le service de vol doit s'assurer que le vol est actif (`active = true`) et que le nombre de places demandées est inférieur ou égal au stock restant (`availableSeats >= quantity`). En cas de dépassement, la réservation est rejetée avec le code HTTP `409` et le motif `INSUFFICIENT_AVAILABILITY`.

#### 5.2 Déroulement du test (Pattern AAA)

| Étape | Action réalisée | Résultat attendu / Vérification |
| :--- | :--- | :--- |
| **1. Préparer (Arrange)** | Initialiser un vol possédant 3 places disponibles et 100 places au total. | L'état initial est connu : `available_seats = 3`. |
| **2. Exécuter (Act)** | Appeler `checkReserveAvailability(flight, 5)` pour demander 5 places. | La méthode évalue la disponibilité par rapport à la demande. |
| **3. Vérifier (Assert)** | Vérifier que `ok === false`, le code est `INSUFFICIENT_AVAILABILITY` et le détail indique `requested: 5, available: 3`. | L'erreur contrôlée est retournée, interdisant tout surbooking. |

#### 5.3 Extrait de code en JavaScript (Node.js Test Runner)

```javascript
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkReserveAvailability } from '../src/domain/flight.js';

test('UT-FLI-14: checkReserveAvailability - règle de gestion (rejet si stock insuffisant)', () => {
  // 1. Arrange
  const flight = { id: 1, active: 1, available_seats: 3, total_seats: 100 };

  // 2. Act
  const result = checkReserveAvailability(flight, 5);

  // 3. Assert
  assert.equal(result.ok, false);
  assert.equal(result.code, 'INSUFFICIENT_AVAILABILITY');
  assert.equal(result.details.requested, 5);
  assert.equal(result.details.available, 3);
});
```

---

### 6. Fiches de spécification des cas de test

#### Fiche 1 : UT-FLI-01 — Validation nominale d'un vol
* **Préconditions** : Données complètes fournies sous forme d'objet JSON.
* **Données d'entrée** : `airline: "Royal Air Maroc"`, `flightNumber: "RAM101"`, `departureCity: "Casablanca"`, `arrivalCity: "Paris"`, `totalSeats: "180"`, `price: "2450.00"`.
* **Étapes** : 1. Appeler `validateFlight(input)`. 2. Inspecter le résultat.
* **Résultat attendu** : `error` indéfini, `totalSeats` converti en entier `180`, `price` converti en `2450`.
* **Statut** : ☑ Réussi

#### Fiche 2 : UT-FLI-07 — Rejet si places disponibles supérieures au total
* **Préconditions** : Données valides sauf `totalSeats: 100` et `availableSeats: 150`.
* **Données d'entrée** : Vol avec incohérence de sièges.
* **Étapes** : 1. Appeler `validateFlight(input)`. 2. Vérifier le code d'erreur.
* **Résultat attendu** : Code HTTP `422`, code d'erreur `BUSINESS_RULE_VIOLATION`.
* **Statut** : ☑ Réussi

#### Fiche 3 : UT-FLI-08 — Rejet si heure d'arrivée antérieure au départ
* **Préconditions** : `departureTime = "2026-06-01 15:00:00"`, `arrivalTime = "2026-06-01 12:00:00"`.
* **Données d'entrée** : Vol avec chronologie inversée.
* **Étapes** : 1. Appeler `validateFlight(input)`.
* **Résultat attendu** : Code HTTP `422`, message `"Arrival time must be strictly after departure time."`.
* **Statut** : ☑ Réussi

#### Fiche 4 : UT-FLI-27 — Unicité du vol en mémoire (Numéro + Heure de départ)
* **Préconditions** : Vol `RAM101` déjà enregistré pour le `2026-06-01 08:00:00`.
* **Données d'entrée** : Nouveau vol avec même numéro et même départ.
* **Étapes** : 1. Tenter `repo.save(doublon)`.
* **Résultat attendu** : Exception déclenchée (`code: 'CONFLICT'`, `status: 409`). Le nombre de vols reste à 1.
* **Statut** : ☑ Réussi

#### Fiche 5 : UT-FLI-28 — Transaction atomique de réservation et journalisation
* **Préconditions** : Vol existant avec 10 places disponibles.
* **Données d'entrée** : Demande de réservation de 3 places (`reservationId = 1001`).
* **Étapes** : 1. Appeler `repo.reserve(1, 3, 1001)`.
* **Résultat attendu** : Statut `200`, places restantes = `7`, 1 mouvement créé avec `delta = -3` et `reason = 'RESERVATION'`.
* **Statut** : ☑ Réussi

---

### 7. Tableau récapitulatif des 30 tests unitaires

| ID | Scénario testé | Résultat attendu | Résultat obtenu | Statut |
| :--- | :--- | :--- | :--- | :---: |
| **UT-FLI-01** | Validation nominale (conversions types et dates) | Données castées et valides | Validé conforme | ☑ Réussi |
| **UT-FLI-02** | Dates au format date seule (YYYY-MM-DD) | Heures par défaut 08:00 et 11:00 | Validé conforme | ☑ Réussi |
| **UT-FLI-03** | Vol à 0 places et prix à 0 MAD | Accepté (cas limites autorisés) | Validé conforme | ☑ Réussi |
| **UT-FLI-04** | Vol sans compagnie aérienne (`airline`) | Erreur 400 `MISSING_FIELD` | Validé conforme | ☑ Réussi |
| **UT-FLI-05** | Vol avec numéro de vol vide ou espaces | Erreur 400 `MISSING_FIELD` | Validé conforme | ☑ Réussi |
| **UT-FLI-06** | Vol sans ville de départ ou arrivée | Erreur 400 `MISSING_FIELD` | Validé conforme | ☑ Réussi |
| **UT-FLI-07** | Sièges disponibles > Sièges totaux | Erreur 422 `BUSINESS_RULE_VIOLATION` | Validé conforme | ☑ Réussi |
| **UT-FLI-08** | Heure d'arrivée <= Heure de départ | Erreur 422 `BUSINESS_RULE_VIOLATION` | Validé conforme | ☑ Réussi |
| **UT-FLI-09** | Prix manquant ou invalide | Erreur 400 `MISSING_FIELD` | Validé conforme | ☑ Réussi |
| **UT-FLI-10** | Sièges totaux <= 0 ou non entiers | Erreur 400 `MISSING_FIELD` | Validé conforme | ☑ Réussi |
| **UT-FLI-11** | Disponibilité réservation : stock suffisant | `{ ok: true }` | Validé conforme | ☑ Réussi |
| **UT-FLI-12** | Disponibilité réservation : stock exactement égal | `{ ok: true }` | Validé conforme | ☑ Réussi |
| **UT-FLI-13** | Disponibilité réservation : vol inactif (`active=0`) | `{ ok: false, code: 'INSUFFICIENT_AVAILABILITY' }` | Validé conforme | ☑ Réussi |
| **UT-FLI-14** | Disponibilité réservation : demande > stock | `{ ok: false, code: 'INSUFFICIENT_AVAILABILITY' }` | Validé conforme | ☑ Réussi |
| **UT-FLI-15** | Libération : réintégration des places libérées | `available_seats + quantity` | Validé conforme | ☑ Réussi |
| **UT-FLI-16** | Libération : plafonnement à `total_seats` | `Math.min(total, available + qty)` | Validé conforme | ☑ Réussi |
| **UT-FLI-17** | Formatage date SQL vers ISO avec 'T' | Format `'YYYY-MM-DDTHH:mm:ss'` | Validé conforme | ☑ Réussi |
| **UT-FLI-18** | Sérialisation ligne SQL vers contrat `KzFlight` | Clés camelCase conformes au frontend | Validé conforme | ☑ Réussi |
| **UT-FLI-19** | Sérialisation de la disponibilité | `{ id, availableSeats, totalSeats, capacity }` | Validé conforme | ☑ Réussi |
| **UT-FLI-20** | `asPositiveInt` : entier > 0, rejet autres | Nombre entier ou `null` | Validé conforme | ☑ Réussi |
| **UT-FLI-21** | `asNonNegativeInt` : entier >= 0 | Nombre entier ou `null` | Validé conforme | ☑ Réussi |
| **UT-FLI-22** | `asPrice` : arrondi 2 décimales, rejet négatifs | Nombre décimal arrondi ou `null` | Validé conforme | ☑ Réussi |
| **UT-FLI-23** | `asDate` et `asDateTime` : formats dates valides | Chaîne normalisée ou `null` | Validé conforme | ☑ Réussi |
| **UT-FLI-24** | `asBoolean` : booléen, "true"/"false", 1/0 | `true` ou `false` | Validé conforme | ☑ Réussi |
| **UT-FLI-25** | `asText` : troncature sécurisée | Chaîne limitée à la taille SQL | Validé conforme | ☑ Réussi |
| **UT-FLI-26** | Dépôt mémoire : ajout et recherche par ID | Vol persisté et retrouvé identique | Validé conforme | ☑ Réussi |
| **UT-FLI-27** | Dépôt mémoire : unicité `flight_number + departure` | Exception 409 `CONFLICT` | Validé conforme | ☑ Réussi |
| **UT-FLI-28** | Dépôt mémoire : réservation & journalisation | Décrémentation et enregistrement `delta=-qty` | Validé conforme | ☑ Réussi |
| **UT-FLI-29** | Dépôt mémoire : échec réservation si manque places | Rejet 409 et stock inchangé | Validé conforme | ☑ Réussi |
| **UT-FLI-30** | Dépôt mémoire : libération & journalisation | Incrémentation et enregistrement `delta=+qty` | Validé conforme | ☑ Réussi |

---

### 8. Environnement et procédure d'exécution

| Élément | Valeur / Configuration |
| :--- | :--- |
| **Langage & version** | JavaScript (Node.js v20+ / ES Modules) |
| **Framework de test** | Test Runner natif Node.js (`node:test`) & Assertions strictes (`node:assert/strict`) |
| **Gestionnaire de paquets** | npm 10+ |
| **Branche Git testée** | `mohammed` |
| **Durée d'exécution totale** | ~230 millisecondes |

**Procédure d'exécution :**
```bash
# Se placer dans le répertoire backend de Mohammed
cd mohammed/backend

# Lancer l'intégralité des 30 tests unitaires
npm test
```

---

### 9. Bilan de la campagne de tests

| Indicateur | Valeur |
| :--- | :---: |
| **Nombre total de tests exécutés** | **30** |
| **Nombre de tests réussis** | **30** |
| **Nombre de tests échoués** | **0** |
| **Nombre de tests bloqués / ignorés** | **0** |
| **Taux de réussite** | **100 %** |
| **Anomalies ouvertes** | **0** |
| **Conclusion** | **☑ Accepté sans réserve** |

---

### 10. Registre des anomalies et corrections

| ID anomalie | Test lié | Description | Responsable | Statut |
| :---: | :---: | :--- | :---: | :---: |
| *Aucune* | — | Tous les scénarios nominaux, limites et erreurs ont été validés dès l'implémentation. | Mohammed | Clôturé |

---

### 11. Validation et signatures

| Intervenant | Nom | Décision / Commentaire | Date & Signature |
| :--- | :--- | :--- | :--- |
| **Développeur responsable** | Mohammed | Implémentation complète et conforme au contrat d'interface | 13/11/2026 — *Signé* |
| **Responsable des tests** | Mohammed | 30 tests exécutés avec succès, aucune anomalie | 13/11/2026 — *Signé* |
| **Chef de projet / Intégrateur** | Kamal | Interface REST compatible avec la réservation et le paiement | 13/11/2026 — *Validé* |
