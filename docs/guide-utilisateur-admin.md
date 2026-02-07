# Guide Utilisateur - Administrateur

## Optiskin - Manuel d'utilisation pour les Administrateurs

---

## Table des matières

1. [Connexion](#1-connexion)
2. [Tableau de bord](#2-tableau-de-bord)
3. [File d'attente](#3-file-dattente)
4. [Gestion des patients](#4-gestion-des-patients)
5. [Pré-consultations](#5-pré-consultations)
6. [Configuration](#6-configuration)

---

## 1. Connexion

1. Ouvrez votre navigateur web
2. Accédez à l'adresse de l'application Optiskin
3. Entrez vos identifiants :
   - **Email** : votre adresse email
   - **Mot de passe** : votre mot de passe
4. Cliquez sur **"Se connecter"**

![Écran de connexion](./screenshots/admin/01-login.png)

Après connexion, vous arrivez sur le **tableau de bord**.

---

## 2. Tableau de bord

Le tableau de bord affiche une vue d'ensemble de l'activité du centre.

![Tableau de bord](./screenshots/admin/02-dashboard.png)

### Cartes statistiques (en haut)

| Carte | Description | Icône |
|-------|-------------|-------|
| **Patients** | Nombre total de patients | Bleu |
| **Séances aujourd'hui** | Séances du jour | Ambre |
| **Séances ce mois** | Total mensuel | Vert |
| **Nouveaux patients** | Nouveaux ce mois | Violet |

### Revenus

![Revenus](./screenshots/admin/03-dashboard-revenue.png)

- **Montant total** en DA
- Répartition par type de paiement (encaissement, prise en charge, etc.)

### Performance médecins

![Performance](./screenshots/admin/04-dashboard-performance.png)

Pour chaque praticien :
- Nom
- Nombre de séances
- Durée moyenne par séance
- Badge comparaison à la moyenne (+X% ou -X%)

### Zones les plus traitées

![Zones](./screenshots/admin/05-dashboard-zones.png)

Graphique à barres des 8 zones les plus fréquentes avec compteur.

### Séances par praticien

Graphique à barres comparant le nombre de séances par praticien.

### Séances par période

![Périodes](./screenshots/admin/06-dashboard-periods.png)

Graphique avec sélecteur de période :
- **Semaine** / **Mois** / **Trimestre** / **Année**

### Effets secondaires

![Effets secondaires](./screenshots/admin/07-dashboard-effects.png)

- Nombre total signalé
- Répartition par sévérité :
  - **Léger** (vert)
  - **Modéré** (ambre)
  - **Sévère** (rouge)
- Graphique de tendance mensuelle

### Démographiques

![Démographiques](./screenshots/admin/08-dashboard-demographics.png)

- **Distribution par âge** : barres par tranche (18-25, 26-35, etc.)
- **Distribution par ville** : liste des villes les plus représentées

### Activité récente

Liste des dernières actions (séances, créations de patients, paiements).

---

## 3. File d'attente

Accédez via **"File d'attente"** dans le menu.

![File d'attente](./screenshots/admin/09-queue.png)

### Fonctionnalités

- Voir tous les patients en attente
- Ajouter un patient à la file
- Voir le statut (en attente, en cabine, terminé)

---

## 4. Gestion des patients

### Liste des patients

Cliquez sur **"Patients"** dans le menu.

![Liste patients](./screenshots/admin/10-patients-list.png)

### Fiche patient

Cliquez sur un patient pour voir sa fiche détaillée :
- Informations personnelles
- Zones de traitement avec progression
- Historique des séances
- Historique des paiements

![Fiche patient](./screenshots/admin/11-patient-detail.png)

---

## 5. Pré-consultations

### Liste des pré-consultations

Cliquez sur **"Pré-consultations"** dans le menu.

![Liste pré-consultations](./screenshots/admin/12-preconsult-list.png)

### Valider une pré-consultation

1. Ouvrez une pré-consultation "En attente"
2. Vérifiez toutes les informations :
   - Démographiques
   - Contre-indications
   - Historique laser
   - Antécédents médicaux
   - Zones éligibles
   - Questionnaire
3. Cliquez sur **"Valider"** ou **"Refuser"**

![Détail pré-consultation](./screenshots/admin/13-preconsult-detail.png)

### Refuser une pré-consultation

1. Cliquez sur **"Refuser"**
2. Saisissez le motif du refus
3. Confirmez

![Refuser](./screenshots/admin/14-preconsult-reject.png)

### Créer un patient depuis une pré-consultation validée

1. Ouvrez la pré-consultation validée
2. Cliquez sur **"Créer le patient"**
3. Vérifiez/modifiez les informations
4. Sélectionnez les zones éligibles
5. Définissez le nombre de séances par zone
6. Validez

---

## 6. Configuration

Accédez via **"Configuration"** dans le menu ou depuis le tableau de bord.

### 6.1 Zones

**Chemin** : Configuration → Zones

![Configuration zones](./screenshots/admin/15-config-zones.png)

#### Créer une zone

1. Cliquez sur **"+ Nouvelle zone"**
2. Remplissez :
   - **Code** : Code court (ex: JBE)
   - **Nom** : Nom complet
   - **Prix** : Tarif par séance
3. Enregistrez

#### Modifier / Supprimer

- Cliquez sur l'icône crayon pour modifier
- Cliquez sur l'icône corbeille pour supprimer

---

### 6.2 Packs

**Chemin** : Configuration → Packs

![Configuration packs](./screenshots/admin/16-config-packs.png)

#### Créer un pack

1. Cliquez sur **"+ Nouveau pack"**
2. Remplissez :
   - **Nom** : Nom du pack
   - **Zones incluses** : Sélectionnez les zones
   - **Prix** : Tarif du pack
   - **Séances par zone** : Nombre inclus
3. Enregistrez

---

### 6.3 Promotions

**Chemin** : Configuration → Promotions

![Configuration promotions](./screenshots/admin/17-config-promotions.png)

#### Créer une promotion

1. Cliquez sur **"+ Nouvelle promotion"**
2. Configurez :
   - **Nom** : Nom de la promotion
   - **Type** : Pourcentage ou Montant
   - **Valeur** : Montant de la réduction
   - **Zones concernées** : Sélectionnez
3. Enregistrez

---

### 6.4 Cabines

**Chemin** : Configuration → Cabines

![Configuration cabines](./screenshots/admin/18-config-boxes.png)

#### Créer une cabine

1. Cliquez sur **"+ Nouvelle cabine"**
2. Remplissez :
   - **Numéro** : Numéro de la cabine
   - **Nom** : Nom descriptif (optionnel)
3. Enregistrez

---

### 6.5 Questionnaire

**Chemin** : Configuration → Questionnaire

![Configuration questionnaire](./screenshots/admin/19-config-questionnaire.png)

#### Types de questions disponibles

| Type | Description |
|------|-------------|
| **Boolean** | Oui / Non |
| **Text** | Réponse texte libre |
| **Number** | Réponse numérique |
| **Choice** | Choix unique parmi options |
| **Multiple** | Choix multiples parmi options |

#### Créer une question

1. Cliquez sur **"+ Nouvelle question"**
2. Remplissez :
   - **Texte** : La question
   - **Type** : Sélectionnez le type
   - **Obligatoire** : Cochez si requise
   - **Options** : Pour choice/multiple
3. Enregistrez

#### Réorganiser

Utilisez les flèches haut/bas pour modifier l'ordre.

---

### 6.6 Rôles

**Chemin** : Configuration → Rôles

![Configuration rôles](./screenshots/admin/20-config-roles.png)

#### Permissions disponibles

| Catégorie | Permissions |
|-----------|-------------|
| **Patients** | Voir, Créer, Modifier, Supprimer |
| **Séances** | Voir, Créer |
| **Pré-consultations** | Voir, Créer, Modifier, Valider, Supprimer |
| **Configuration** | Voir, Modifier |
| **Utilisateurs** | Voir, Créer, Modifier, Supprimer |
| **Zones** | Voir, Gérer |
| **Cabines** | Voir, Assigner |
| **Dashboard** | Voir, Complet |

#### Créer un rôle

1. Cliquez sur **"+ Nouveau rôle"**
2. Remplissez :
   - **Nom** : Nom du rôle
   - **Permissions** : Sélectionnez
3. Enregistrez

---

### 6.7 Utilisateurs

**Chemin** : Configuration → Utilisateurs

![Configuration utilisateurs](./screenshots/admin/21-config-users.png)

#### Créer un utilisateur

1. Cliquez sur **"+ Nouvel utilisateur"**
2. Remplissez :
   - **Email** : Adresse email (identifiant)
   - **Mot de passe** : Mot de passe initial
   - **Nom** : Nom de famille
   - **Prénom** : Prénom
   - **Rôle** : Sélectionnez
3. Enregistrez

---

## Navigation du menu

| Élément | Description |
|---------|-------------|
| **Dashboard** | Tableau de bord |
| **File d'attente** | Patients en attente |
| **Patients** | Liste des patients |
| **Pré-consultations** | Liste des pré-consultations |
| **Agenda** | Planning |
| **Paiements** | Historique paiements |
| **Configuration** | Sous-menu config |

### Sous-menu Configuration

- Zones
- Packs
- Promotions
- Cabines
- Questionnaire
- Rôles
- Utilisateurs

---

## Support

En cas de problème :
1. Vérifiez votre connexion
2. Actualisez la page
3. Contactez le support technique

---

*Documentation Optiskin v2.2.0 - Février 2026*
*Basée sur le code source frontend-v2*
