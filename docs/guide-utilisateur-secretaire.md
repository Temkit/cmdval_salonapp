# Guide Utilisateur - Secrétaire

## Optiskin - Manuel d'utilisation pour les Secrétaires

---

## Table des matières

1. [Connexion](#1-connexion)
2. [File d'attente](#2-file-dattente)
3. [Gestion des patients](#3-gestion-des-patients)
4. [Pré-consultations](#4-pré-consultations)
5. [Workflow quotidien](#5-workflow-quotidien)

---

## 1. Connexion

### Accès à l'application

1. Ouvrez votre navigateur web
2. Accédez à l'adresse de l'application Optiskin
3. Entrez vos identifiants :
   - **Email** : votre adresse email professionnelle
   - **Mot de passe** : votre mot de passe

![Écran de connexion](./screenshots/secretaire/01-login.png)

4. Cliquez sur **"Se connecter"**

Après connexion, vous arrivez directement sur la **file d'attente**.

---

## 2. File d'attente

La file d'attente est votre écran principal de travail. Elle affiche tous les patients présents dans le centre.

### Vue d'ensemble

![File d'attente secrétaire](./screenshots/secretaire/02-queue.png)

### Sections de la file

| Section | Description |
|---------|-------------|
| **En attente** | Patients arrivés, pas encore appelés |
| **En cabine** | Patients en cours de traitement |
| **Terminés** | Patients ayant fini leur séance |

### Ajouter un patient à la file

#### Patient existant

1. Cliquez sur le bouton **"+ Ajouter à la file"**
2. Tapez le nom ou le code carte du patient
3. Sélectionnez le patient dans la liste

![Recherche patient](./screenshots/secretaire/03-queue-search.png)

4. Le patient apparaît dans la section "En attente"

#### Nouveau patient

Si le patient n'existe pas :

1. Cliquez sur **"Nouveau patient"**
2. Vous serez redirigé vers le formulaire de pré-consultation

### Gérer un patient dans la file

Chaque carte patient affiche :

![Carte patient file](./screenshots/secretaire/04-queue-card.png)

- **Photo** (si disponible)
- **Nom et prénom**
- **Heure d'arrivée**
- **Zones à traiter** avec le nombre de séances restantes
- **Temps d'attente**

#### Actions disponibles

| Bouton | Action |
|--------|--------|
| **Voir fiche** | Ouvre le détail du patient |
| **Reporter** | Replace le patient en fin de file |
| **Retirer** | Retire le patient de la file |

### Notifications en temps réel

La file se met à jour automatiquement quand :
- Un praticien appelle un patient
- Une séance est terminée
- Un autre utilisateur ajoute un patient

![Notification](./screenshots/secretaire/05-queue-notification.png)

---

## 3. Gestion des patients

### Accéder à la liste des patients

1. Cliquez sur **"Patients"** dans le menu latéral

![Liste patients](./screenshots/secretaire/06-patients-list.png)

### Rechercher un patient

Utilisez la barre de recherche en haut de page :

- Tapez le **nom** ou **prénom**
- Ou le **numéro de téléphone**
- Ou le **code carte**

Les résultats s'affichent en temps réel.

### Consulter la fiche patient

1. Cliquez sur le nom du patient dans la liste

![Fiche patient](./screenshots/secretaire/07-patient-detail.png)

#### Informations affichées

**Onglet Informations**
- Coordonnées complètes
- Date de naissance
- Phototype
- Notes

**Onglet Zones**

![Zones patient](./screenshots/secretaire/08-patient-zones.png)

Pour chaque zone :
- Nom de la zone
- Progression (séances effectuées / total)
- Barre de progression visuelle

**Onglet Séances**
- Historique de toutes les séances
- Date, zones traitées, praticien
- Observations éventuelles

**Onglet Paiements**
- Historique des paiements
- Type de paiement (carte, espèces, chèque)
- Montants

### Modifier les informations patient

1. Ouvrez la fiche du patient
2. Cliquez sur **"Modifier"**
3. Mettez à jour les informations
4. Cliquez sur **"Enregistrer"**

![Modifier patient](./screenshots/secretaire/09-patient-edit.png)

> **Note** : Certaines modifications (zones, séances) nécessitent des droits administrateur.

---

## 4. Pré-consultations

La pré-consultation est l'étape obligatoire avant de créer un patient dans le système.

### Pourquoi la pré-consultation ?

Elle permet de :
- Recueillir les informations médicales
- Identifier les contre-indications
- Déterminer les zones éligibles au traitement
- Obtenir le consentement éclairé

### Créer une pré-consultation

#### Étape 1 : Accéder au formulaire

1. Cliquez sur **"Patients"** → **"Nouveau"**
2. Ou depuis la file d'attente → **"Nouveau patient"**

Vous êtes redirigé vers le formulaire de pré-consultation.

![Intro pré-consultation](./screenshots/secretaire/10-preconsult-intro.png)

#### Étape 2 : Informations du patient

![Étape patient](./screenshots/secretaire/11-preconsult-patient.png)

**Pour un nouveau patient :**
- Saisissez le prénom, nom, téléphone
- Optionnel : email, code carte

**Pour un patient existant :**
- Recherchez et sélectionnez le patient
- Cliquez sur "Changer" pour modifier

#### Étape 3 : Données démographiques

![Étape démographiques](./screenshots/secretaire/12-preconsult-demo.png)

Remplissez :
- **Sexe** : Femme / Homme
- **Âge** : En années
- **Statut marital** : Célibataire, Marié(e), Divorcé(e), Veuf/Veuve
- **Phototype** : I à VI (cliquez sur la couleur correspondante)

#### Étape 4 : Contre-indications (femmes uniquement)

![Étape contre-indications](./screenshots/secretaire/13-preconsult-contraind.png)

Vérifiez auprès de la patiente :
- **Enceinte** : Grossesse en cours
- **Allaitement** : Allaitement en cours
- **Projet de grossesse** : Dans les 6 prochains mois

> **Attention** : Si l'une de ces cases est cochée, une alerte s'affiche. Le traitement laser est contre-indiqué.

#### Étape 5 : Historique laser

![Étape historique laser](./screenshots/secretaire/14-preconsult-laser.png)

Demandez au patient s'il a déjà fait des séances laser :

**Si oui :**
- A-t-il utilisé le Clarity II ?
- Combien de séances ?
- Quelle marque d'appareil ?

#### Étape 6 : Antécédents médicaux

![Étape antécédents](./screenshots/secretaire/15-preconsult-medical.png)

**Conditions médicales** (cochez si présent) :
- Épilepsie
- SOPK (Syndrome des ovaires polykystiques)
- Troubles hormonaux
- Diabète
- Maladies auto-immunes
- Cicatrices chéloïdes
- Herpès

**Conditions dermatologiques** :
- Eczéma
- Psoriasis
- Vitiligo
- Acné
- Rosacée
- Mélasma

**Traitements en cours** :
- Toggle oui/non
- Si oui, détaillez dans la zone de texte

**Peeling récent** :
- Dans les 3 derniers mois ?

#### Étape 7 : Méthodes d'épilation

![Étape épilation](./screenshots/secretaire/16-preconsult-epilation.png)

Cochez les méthodes utilisées par le patient :
- Rasoir
- Cire
- Crème dépilatoire
- Fil
- Pince à épiler
- Épilateur électrique
- Tondeuse

#### Étape 8 : Zones éligibles

![Étape zones](./screenshots/secretaire/17-preconsult-zones.png)

1. Cliquez sur **"+ Ajouter une zone"**
2. Sélectionnez la zone dans la liste
3. Pour chaque zone ajoutée :
   - **Éligible** : Toggle vert = traitement possible
   - **Non éligible** : Toggle rouge + saisir les observations

![Zone non éligible](./screenshots/secretaire/18-preconsult-zone-ineligible.png)

4. Ajoutez des notes générales si nécessaire

### Soumettre la pré-consultation

1. Vérifiez toutes les informations
2. Cliquez sur **"Enregistrer"**

La pré-consultation est créée en statut **"Brouillon"**.

![Soumettre pré-consultation](./screenshots/secretaire/19-preconsult-submit.png)

3. Cliquez sur **"Soumettre pour validation"**

Le statut passe à **"En attente de validation"**.

### Suivre mes pré-consultations

1. Cliquez sur **"Pré-consultations"** dans le menu

![Liste pré-consultations](./screenshots/secretaire/20-preconsult-list.png)

Vous voyez toutes les pré-consultations avec leur statut :

| Badge | Signification |
|-------|---------------|
| 🟡 **Brouillon** | En cours de saisie |
| 🔵 **En attente** | Soumise, attend validation admin |
| 🟢 **Validée** | Approuvée par un admin |
| 🔴 **Refusée** | Refusée (voir le motif) |

### Pré-consultation refusée

Si une pré-consultation est refusée :

1. Ouvrez la pré-consultation
2. Consultez le **motif du refus** en haut de page
3. Vous pouvez créer une nouvelle pré-consultation avec les corrections

![Pré-consultation refusée](./screenshots/secretaire/21-preconsult-rejected.png)

---

## 5. Workflow quotidien

### Début de journée

1. **Connexion** à l'application
2. **Vérification** de la file d'attente
3. **Accueil** des premiers patients

### Arrivée d'un patient

```
Patient arrive
     ↓
Patient connu ? ──Non──→ Créer pré-consultation
     ↓ Oui                      ↓
Ajouter à la file      Soumettre pour validation
     ↓                         ↓
Patient en attente     Attendre validation admin
                              ↓
                       Patient créé
                              ↓
                       Ajouter à la file
```

![Workflow arrivée](./screenshots/secretaire/22-workflow-arrival.png)

### Pendant la journée

- **Surveiller** la file d'attente
- **Ajouter** les patients arrivants
- **Gérer** les retards et reports
- **Répondre** aux questions des patients

### Fin de journée

1. Vérifier que tous les patients sont traités
2. Noter les rendez-vous manqués
3. Préparer le planning du lendemain

---

## Conseils pratiques

### Recherche rapide

- Utilisez le **code carte** pour une recherche plus rapide
- Le **numéro de téléphone** fonctionne aussi

### Gestion des files longues

- Informez les patients du temps d'attente estimé
- Utilisez la fonction **"Reporter"** pour les urgences

### Pré-consultations

- Préparez le questionnaire **avant** l'arrivée du patient si possible
- Soyez attentif aux **contre-indications** (grossesse, allaitement)
- En cas de doute, demandez à un administrateur

---

## Support

En cas de problème :
1. Vérifiez votre connexion internet
2. Actualisez la page (F5)
3. Contactez votre administrateur

---

*Documentation Optiskin v2.2.0 - Janvier 2026*
