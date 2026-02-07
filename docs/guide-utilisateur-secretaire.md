# Guide Utilisateur - Secrétaire

## Optiskin - Manuel d'utilisation pour les Secrétaires

---

## Table des matières

1. [Connexion](#1-connexion)
2. [File d'attente](#2-file-dattente)
3. [Gestion des patients](#3-gestion-des-patients)
4. [Pré-consultations (8 étapes)](#4-pré-consultations-8-étapes)
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

Après connexion, vous arrivez sur la **file d'attente** (page d'accueil secrétaire).

---

## 2. File d'attente

La file d'attente est votre écran principal de travail.

### Vue d'ensemble

![File d'attente secrétaire](./screenshots/secretaire/02-queue.png)

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

### Carte patient dans la file

Chaque carte affiche :
- **Nom et prénom**
- **Heure d'arrivée**
- **Zones à traiter** avec séances restantes
- **Temps d'attente**

![Carte patient](./screenshots/secretaire/04-queue-card.png)

### Notifications temps réel

La file se met à jour automatiquement quand :
- Un praticien appelle un patient
- Une séance est terminée
- Un autre utilisateur modifie la file

---

## 3. Gestion des patients

### Accéder à la liste des patients

1. Cliquez sur **"Patients"** dans le menu latéral

![Liste patients](./screenshots/secretaire/05-patients-list.png)

### Rechercher un patient

Utilisez la barre de recherche :
- Nom ou prénom
- Numéro de téléphone
- Code carte

### Consulter la fiche patient

Cliquez sur le nom du patient pour voir sa fiche.

![Fiche patient](./screenshots/secretaire/06-patient-detail.png)

**Onglet Zones :**

Pour chaque zone :
- Nom de la zone
- Progression (séances effectuées / total)
- Barre de progression visuelle

![Zones patient](./screenshots/secretaire/07-patient-zones.png)

---

## 4. Pré-consultations (8 étapes)

La pré-consultation est **obligatoire** avant de créer un patient. Elle comporte **8 étapes**.

### Pourquoi la pré-consultation ?

- Recueillir les informations médicales
- Identifier les contre-indications
- Déterminer les zones éligibles
- Remplir le questionnaire configurable

### Créer une pré-consultation

1. Cliquez sur **"Patients"** → **"Nouveau"**
2. Ou depuis la file → **"Nouveau patient"**

Vous êtes redirigé vers le formulaire en 8 étapes.

### Indicateur de progression

En haut du formulaire, des points indiquent la progression :
- Point allongé bleu = étape actuelle
- Petits points bleus = étapes complétées
- Petits points gris = étapes restantes

![Progression](./screenshots/secretaire/08-preconsult-progress.png)

---

### Étape 0/7 : Patient

![Étape 0 - Patient](./screenshots/secretaire/09-preconsult-step0.png)

**Pour un patient existant :**
1. Tapez dans la barre de recherche
2. Sélectionnez le patient
3. Cliquez sur "Changer" pour modifier

**Pour un nouveau patient :**
1. Cliquez sur **"Nouveau patient"**
2. Remplissez :
   - **Prénom** (obligatoire)
   - **Nom** (obligatoire)
   - **Téléphone**
   - **Code carte** (généré automatiquement si vide)
3. Cliquez sur **"Créer et continuer"**

---

### Étape 1/7 : Démographiques

![Étape 1 - Démographiques](./screenshots/secretaire/10-preconsult-step1.png)

| Champ | Type | Options |
|-------|------|---------|
| **Sexe** | Boutons | Femme / Homme |
| **Âge** | Nombre | Champ numérique (obligatoire) |
| **Statut marital** | Boutons | Célibataire, Marié(e), Divorcé(e), Veuf/Veuve |
| **Phototype** | Grille | I, II, III, IV, V, VI |

---

### Étape 2/7 : Contre-indications (femmes uniquement)

**Cette étape s'affiche uniquement si Sexe = Femme.**

![Étape 2 - Contre-indications](./screenshots/secretaire/11-preconsult-step2.png)

Cases à cocher :
- **Enceinte**
- **Allaitement**
- **Projet de grossesse**

> **Attention** : Si une case est cochée, une alerte rouge s'affiche :
> "Attention : une ou plusieurs contre-indications sont présentes."

---

### Étape 3/7 : Historique laser

![Étape 3 - Historique laser](./screenshots/secretaire/12-preconsult-step3.png)

1. Cochez **"A déjà fait du laser"** si oui

Si coché, des champs supplémentaires apparaissent :
- **Clarity II** : case à cocher
- **Nombre de séances** : champ numérique
- **Marque de l'appareil** : champ texte (ex: Soprano)

---

### Étape 4/7 : Antécédents médicaux

![Étape 4 - Antécédents](./screenshots/secretaire/13-preconsult-step4.png)

**Conditions médicales** (grille de cases) :
- Épilepsie
- SOPK
- Trouble hormonal
- Diabète
- Maladie auto-immune
- Kéloïdes
- Herpès
- Acné juvénile
- Migraine photosensible
- Mycose
- Hyper-réactivité cutanée
- Tumeur cutanée

**Conditions dermatologiques** :
- Eczéma, Psoriasis, Vitiligo, Acné, Rosacée, Mélasma

**Traitement en cours** :
- Case à cocher
- Si oui : zone de texte pour les détails

**Peeling récent** :
- Case à cocher

---

### Étape 5/7 : Méthodes d'épilation

![Étape 5 - Méthodes épilation](./screenshots/secretaire/14-preconsult-step5.png)

Cochez les méthodes utilisées par le patient :
- Rasoir
- Cire
- Crème dépilatoire
- Fil
- Pince à épiler
- Épilateur
- Tondeuse
- Laser

---

### Étape 6/7 : Zones éligibles

![Étape 6 - Zones](./screenshots/secretaire/15-preconsult-step6.png)

**Ajouter une zone :**
1. Cliquez sur un bouton zone (ex: "+ Jambes")
2. La zone s'ajoute à la liste

**Pour chaque zone ajoutée :**
- Bouton **"Éligible"** (vert) / **"Non éligible"** (rouge)
- Si non éligible : zone de texte pour les observations
- Bouton corbeille pour supprimer

![Zone non éligible](./screenshots/secretaire/16-preconsult-zone-ineligible.png)

**Notes générales :**
Zone de texte pour observations supplémentaires.

> **Important** : Au moins une zone doit être ajoutée pour continuer.

---

### Étape 7/7 : Questionnaire

![Étape 7 - Questionnaire](./screenshots/secretaire/17-preconsult-step7.png)

Cette étape affiche les questions configurées par l'administrateur.

**Types de questions :**

| Type | Affichage |
|------|-----------|
| **Boolean** | Boutons "Oui" / "Non" |
| **Texte** | Zone de texte |
| **Nombre** | Champ numérique |
| **Choix** | Boutons pour chaque option |
| **Multiple** | Cases à cocher pour chaque option |

Les questions obligatoires sont marquées d'un astérisque rouge (*).

> **Note** : Si aucune question n'est configurée, le message "Aucune question configurée" s'affiche.

---

### Soumettre la pré-consultation

Après l'étape 7, cliquez sur **"Créer la pré-consultation"**.

![Soumettre](./screenshots/secretaire/18-preconsult-submit.png)

La pré-consultation est créée en statut **"Brouillon"**.

Vous êtes redirigé vers la page de détail où vous pouvez :
1. Cliquez sur **"Soumettre pour validation"**
2. Le statut passe à **"En attente de validation"**

---

### Suivre les pré-consultations

1. Cliquez sur **"Pré-consultations"** dans le menu

![Liste pré-consultations](./screenshots/secretaire/19-preconsult-list.png)

**Statuts :**

| Badge | Signification |
|-------|---------------|
| **Brouillon** | En cours, pas encore soumise |
| **En attente** | Soumise, attend validation admin |
| **Validée** | Approuvée |
| **Refusée** | Refusée (voir le motif) |

### Pré-consultation refusée

Si refusée :
1. Ouvrez la pré-consultation
2. Le motif du refus s'affiche en haut
3. Créez une nouvelle pré-consultation si nécessaire

![Refusée](./screenshots/secretaire/20-preconsult-rejected.png)

---

## 5. Workflow quotidien

### Arrivée d'un patient

```
Patient arrive
      ↓
Patient connu ? ───Non───→ Créer pré-consultation (8 étapes)
      ↓ Oui                         ↓
Ajouter à la file           Soumettre pour validation
      ↓                             ↓
Patient en attente          Attendre validation admin
                                    ↓
                            Si validée → Patient créé
                                    ↓
                            Ajouter à la file
```

### Pendant la journée

- **Surveiller** la file d'attente
- **Ajouter** les patients arrivants
- **Créer** les pré-consultations pour les nouveaux

### Conseils pratiques

| Situation | Action |
|-----------|--------|
| Recherche rapide | Utilisez le code carte |
| Nouveau patient | Commencez par la pré-consultation |
| Contre-indication | Informez immédiatement un responsable |
| Doute médical | Demandez à un administrateur |

---

## Navigation

| Menu | Description |
|------|-------------|
| **File d'attente** | Page d'accueil, patients en attente |
| **Patients** | Liste de tous les patients |
| **Pré-consultations** | Liste des pré-consultations |
| **Agenda** | Planning des rendez-vous |
| **Paiements** | Historique des paiements |

---

## Support

En cas de problème :
1. Vérifiez votre connexion internet
2. Actualisez la page (F5)
3. Contactez votre administrateur

---

*Documentation Optiskin v2.2.0 - Février 2026*
*Basée sur le code source frontend-v2*
