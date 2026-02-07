# Guide Utilisateur - Administrateur

## Optiskin - Manuel d'utilisation pour les Administrateurs

---

## Table des matières

1. [Connexion](#1-connexion)
2. [Tableau de bord](#2-tableau-de-bord)
3. [Gestion de la file d'attente](#3-gestion-de-la-file-dattente)
4. [Gestion des patients](#4-gestion-des-patients)
5. [Gestion des pré-consultations](#5-gestion-des-pré-consultations)
6. [Configuration du système](#6-configuration-du-système)
7. [Gestion des utilisateurs](#7-gestion-des-utilisateurs)

---

## 1. Connexion

### Accès à l'application

1. Ouvrez votre navigateur web (Chrome, Firefox, Safari)
2. Accédez à l'adresse de l'application Optiskin
3. Entrez vos identifiants :
   - **Email** : votre adresse email
   - **Mot de passe** : votre mot de passe

![Écran de connexion](./screenshots/admin/01-login.png)

4. Cliquez sur **"Se connecter"**

> **Note** : En tant qu'administrateur, vous avez accès à toutes les fonctionnalités du système.

---

## 2. Tableau de bord

Après connexion, vous arrivez sur le tableau de bord principal qui affiche les indicateurs clés.

### Vue d'ensemble

![Tableau de bord admin](./screenshots/admin/02-dashboard.png)

Le tableau de bord présente :

| Section | Description |
|---------|-------------|
| **Séances aujourd'hui** | Nombre de séances prévues pour la journée |
| **Patients actifs** | Nombre total de patients avec des séances en cours |
| **Revenus du mois** | Chiffre d'affaires mensuel |
| **Taux de complétion** | Pourcentage de séances terminées |

### Navigation principale

La barre latérale gauche permet d'accéder à :

- **Tableau de bord** - Vue d'ensemble
- **File d'attente** - Gestion des patients en attente
- **Patients** - Liste et gestion des patients
- **Pré-consultations** - Gestion des consultations préalables
- **Paiements** - Suivi des encaissements
- **Configuration** - Paramètres du système

---

## 3. Gestion de la file d'attente

### Accéder à la file d'attente

1. Cliquez sur **"File d'attente"** dans le menu latéral

![File d'attente](./screenshots/admin/03-queue.png)

### Fonctionnalités de la file

#### Ajouter un patient à la file

1. Cliquez sur le bouton **"+ Ajouter"**
2. Recherchez le patient par nom ou numéro de carte
3. Sélectionnez le patient
4. Le patient apparaît dans la file d'attente

![Ajouter à la file](./screenshots/admin/04-queue-add.png)

#### Gérer les patients en attente

Chaque carte patient affiche :
- **Nom et prénom** du patient
- **Heure d'arrivée**
- **Zones à traiter**
- **Statut** (En attente, En cours, Terminé)

Actions disponibles :
- **Appeler** - Assigner le patient à une cabine
- **Reporter** - Remettre en fin de file
- **Annuler** - Retirer de la file

---

## 4. Gestion des patients

### Liste des patients

1. Cliquez sur **"Patients"** dans le menu

![Liste patients](./screenshots/admin/05-patients-list.png)

### Rechercher un patient

Utilisez la barre de recherche pour trouver un patient par :
- Nom / Prénom
- Numéro de téléphone
- Code carte

### Créer un nouveau patient

1. Cliquez sur **"+ Nouveau patient"**
2. Remplissez le formulaire :

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Nom | Oui | Nom de famille |
| Prénom | Oui | Prénom |
| Téléphone | Oui | Numéro de téléphone |
| Email | Non | Adresse email |
| Code carte | Oui | Numéro de carte fidélité |

![Créer patient](./screenshots/admin/06-patient-create.png)

3. Cliquez sur **"Enregistrer"**

### Fiche patient détaillée

Cliquez sur un patient pour accéder à sa fiche complète.

![Fiche patient](./screenshots/admin/07-patient-detail.png)

#### Onglets disponibles

1. **Informations** - Données personnelles
2. **Zones** - Zones de traitement assignées
3. **Séances** - Historique des séances
4. **Paiements** - Historique des paiements
5. **Documents** - Consentements et documents

#### Ajouter une zone de traitement

1. Allez dans l'onglet **"Zones"**
2. Cliquez sur **"+ Ajouter une zone"**
3. Sélectionnez la zone dans la liste
4. Définissez le nombre de séances prévues
5. Validez

![Ajouter zone](./screenshots/admin/08-patient-add-zone.png)

---

## 5. Gestion des pré-consultations

### Liste des pré-consultations

1. Cliquez sur **"Pré-consultations"** dans le menu

![Liste pré-consultations](./screenshots/admin/09-preconsult-list.png)

### Statuts des pré-consultations

| Statut | Description | Action requise |
|--------|-------------|----------------|
| **Brouillon** | En cours de saisie | Compléter et soumettre |
| **En attente** | Soumise, en attente de validation | Valider ou refuser |
| **Validée** | Approuvée | Créer le patient |
| **Refusée** | Non approuvée | Consulter le motif |

### Valider une pré-consultation

1. Ouvrez la pré-consultation en attente
2. Vérifiez les informations :
   - Données démographiques
   - Contre-indications
   - Historique laser
   - Antécédents médicaux
   - Zones éligibles

![Détail pré-consultation](./screenshots/admin/10-preconsult-detail.png)

3. Cliquez sur **"Valider"** ou **"Refuser"**

#### En cas de refus

1. Cliquez sur **"Refuser"**
2. Saisissez le motif du refus
3. Confirmez

![Refuser pré-consultation](./screenshots/admin/11-preconsult-reject.png)

### Créer un patient depuis une pré-consultation validée

1. Ouvrez la pré-consultation validée
2. Cliquez sur **"Créer le patient"**
3. Vérifiez les informations pré-remplies
4. Sélectionnez les zones éligibles
5. Validez la création

![Créer patient depuis pré-consult](./screenshots/admin/12-preconsult-create-patient.png)

---

## 6. Configuration du système

### Accéder à la configuration

1. Cliquez sur **"Configuration"** dans le menu

![Menu configuration](./screenshots/admin/13-config-menu.png)

### 6.1 Gestion des zones

**Chemin** : Configuration → Zones

![Configuration zones](./screenshots/admin/14-config-zones.png)

#### Créer une zone

1. Cliquez sur **"+ Nouvelle zone"**
2. Remplissez :
   - **Code** : Code court (ex: JBE pour Jambes)
   - **Nom** : Nom complet de la zone
   - **Prix** : Tarif par séance
3. Enregistrez

#### Modifier une zone

1. Cliquez sur l'icône **crayon** de la zone
2. Modifiez les informations
3. Enregistrez

### 6.2 Gestion des packs

**Chemin** : Configuration → Packs

![Configuration packs](./screenshots/admin/15-config-packs.png)

#### Créer un pack

1. Cliquez sur **"+ Nouveau pack"**
2. Remplissez :
   - **Nom** : Nom du pack
   - **Zones incluses** : Sélectionnez les zones
   - **Prix** : Tarif du pack
   - **Séances par zone** : Nombre de séances incluses
3. Enregistrez

### 6.3 Gestion des promotions

**Chemin** : Configuration → Promotions

![Configuration promotions](./screenshots/admin/16-config-promotions.png)

#### Créer une promotion

1. Cliquez sur **"+ Nouvelle promotion"**
2. Configurez :
   - **Nom** : Nom de la promotion
   - **Type** : Pourcentage ou Montant fixe
   - **Valeur** : Montant de la réduction
   - **Zones concernées** : Sélectionnez les zones
   - **Période de validité** : Dates de début et fin
3. Activez la promotion
4. Enregistrez

### 6.4 Gestion des cabines

**Chemin** : Configuration → Cabines

![Configuration cabines](./screenshots/admin/17-config-boxes.png)

#### Créer une cabine

1. Cliquez sur **"+ Nouvelle cabine"**
2. Remplissez :
   - **Numéro** : Numéro de la cabine
   - **Nom** : Nom descriptif (optionnel)
3. Enregistrez

### 6.5 Configuration du questionnaire

**Chemin** : Configuration → Questionnaire

![Configuration questionnaire](./screenshots/admin/18-config-questionnaire.png)

#### Ajouter une question

1. Cliquez sur **"+ Nouvelle question"**
2. Configurez :
   - **Texte** : La question à poser
   - **Type de réponse** : Oui/Non, Texte, Nombre, Choix
   - **Obligatoire** : Cochez si la réponse est requise
   - **Options** : Pour les questions à choix multiples
3. Enregistrez

#### Réorganiser les questions

Utilisez les flèches haut/bas pour modifier l'ordre d'affichage des questions.

### 6.6 Gestion des rôles

**Chemin** : Configuration → Rôles

![Configuration rôles](./screenshots/admin/19-config-roles.png)

#### Créer un rôle

1. Cliquez sur **"+ Nouveau rôle"**
2. Configurez :
   - **Nom** : Nom du rôle
   - **Permissions** : Sélectionnez les autorisations

| Catégorie | Permissions disponibles |
|-----------|------------------------|
| Patients | Voir, Créer, Modifier, Supprimer |
| Séances | Voir, Créer |
| Configuration | Voir, Modifier |
| Utilisateurs | Voir, Créer, Modifier, Supprimer |
| Tableau de bord | Voir |

3. Enregistrez

---

## 7. Gestion des utilisateurs

**Chemin** : Configuration → Utilisateurs

![Gestion utilisateurs](./screenshots/admin/20-config-users.png)

### Créer un utilisateur

1. Cliquez sur **"+ Nouvel utilisateur"**
2. Remplissez :
   - **Email** : Adresse email (servira d'identifiant)
   - **Mot de passe** : Mot de passe initial
   - **Nom** : Nom de famille
   - **Prénom** : Prénom
   - **Rôle** : Sélectionnez le rôle approprié
3. Enregistrez

![Créer utilisateur](./screenshots/admin/21-user-create.png)

### Modifier un utilisateur

1. Cliquez sur l'utilisateur dans la liste
2. Modifiez les informations nécessaires
3. Enregistrez

### Désactiver un utilisateur

1. Cliquez sur l'utilisateur
2. Cliquez sur **"Désactiver"**
3. Confirmez

> **Note** : Les utilisateurs désactivés ne peuvent plus se connecter mais leur historique est conservé.

---

## Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl + K` | Recherche rapide |
| `Echap` | Fermer les dialogues |

---

## Support

En cas de problème technique, contactez votre administrateur système.

---

*Documentation Optiskin v2.2.0 - Janvier 2026*
