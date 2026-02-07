# Guide Utilisateur - Praticien

## Optiskin - Manuel d'utilisation pour les Praticiens

---

## Table des matières

1. [Connexion et sélection de cabine](#1-connexion-et-sélection-de-cabine)
2. [File d'attente](#2-file-dattente)
3. [Assistant de séance (3 étapes)](#3-assistant-de-séance-3-étapes)
4. [Séance active](#4-séance-active)
5. [Workflow quotidien](#5-workflow-quotidien)

---

## 1. Connexion et sélection de cabine

### Se connecter

1. Ouvrez votre navigateur web
2. Accédez à l'adresse de l'application Optiskin
3. Entrez vos identifiants :
   - **Email** : votre adresse email professionnelle
   - **Mot de passe** : votre mot de passe

![Écran de connexion](./screenshots/praticien/01-login.png)

4. Cliquez sur **"Se connecter"**

### Sélectionner votre cabine

Après connexion, vous pouvez choisir votre cabine de travail.

![Sélection cabine](./screenshots/praticien/02-select-box.png)

1. La grille affiche toutes les cabines disponibles
2. Chaque cabine indique son statut :
   - **Disponible** (vert) : Vous pouvez la sélectionner
   - **Occupée** (gris + nom) : Un autre praticien l'utilise
   - **Votre cabine** (bordure bleue) : Cabine actuellement sélectionnée

3. Cliquez sur une cabine **disponible**
4. Vous êtes redirigé vers la file d'attente

---

## 2. File d'attente

La file d'attente affiche les patients prêts pour leur séance.

### Vue d'ensemble

![File d'attente praticien](./screenshots/praticien/03-queue.png)

### Comprendre la file

Chaque carte patient affiche :

| Information | Description |
|-------------|-------------|
| **Nom** | Nom et prénom du patient |
| **Zones** | Zones à traiter avec séances restantes |
| **Attente** | Temps écoulé depuis l'arrivée |
| **Phototype** | Type de peau (I à VI) |

### Appeler un patient

1. Repérez le patient suivant dans la file
2. Cliquez sur le bouton **"Appeler"**

![Appeler patient](./screenshots/praticien/04-queue-call.png)

3. Vous êtes redirigé vers l'assistant de séance

---

## 3. Assistant de séance (3 étapes)

L'assistant de séance guide la préparation du traitement en **3 étapes**.

### Étape 1/3 : Sélectionner les zones

![Étape 1 - Zones](./screenshots/praticien/05-seance-step1.png)

L'écran affiche toutes les zones du patient avec des séances restantes.

Pour chaque zone :
- **Nom de la zone**
- **Progression** : Séance X/Y (ex: 3/6)
- **Barre de progression** visuelle
- **Case à cocher** : Cliquez pour sélectionner

**Actions :**
1. Cliquez sur les cartes des zones à traiter
2. Les zones sélectionnées ont une bordure bleue
3. Cliquez sur **"Suivant"**

> **Note** : Vous pouvez sélectionner plusieurs zones pour une séance multi-zones.

### Étape 2/3 : Paramètres laser

![Étape 2 - Paramètres](./screenshots/praticien/06-seance-step2.png)

Pour chaque zone sélectionnée, configurez les paramètres laser.

#### Type de laser

Deux boutons : **Alexandrite** ou **Yag**

#### Taille du spot (mm)

Boutons de sélection : 12, 15, 16, 18, 20, 22, 25

#### Paramètres numériques

| Champ | Unité | Description |
|-------|-------|-------------|
| **Fluence** | J/cm² | Énergie du laser |
| **Pulse** | ms | Durée d'impulsion |
| **Freq** | Hz | Fréquence |

> **Astuce** : Les paramètres de la dernière séance sont chargés automatiquement.

Cliquez sur **"Suivant"** pour continuer.

### Étape 3/3 : Confirmer la séance

![Étape 3 - Confirmation](./screenshots/praticien/07-seance-step3.png)

L'écran de confirmation affiche :

**Résumé patient :**
- Initiales dans un cercle coloré
- Nom complet
- Phototype (badge)
- Code carte (badge)

**Résumé par zone :**
- Nom de la zone
- Numéro de séance (ex: 4/6)
- Paramètres laser en badges :
  - Type laser (Alexandrite/Yag)
  - Spot (18mm)
  - Fluence (J/cm²)
  - Pulse (ms)
  - Fréquence (Hz)

**Action :**

Cliquez sur le gros bouton **"Démarrer la séance"** pour lancer le traitement.

---

## 4. Séance active

Après le démarrage, vous arrivez sur l'écran de séance active.

### Écran principal

![Séance active](./screenshots/praticien/08-active-session.png)

L'écran affiche :

**En haut :**
- Nom du patient
- Badge de la zone en cours
- Badge numéro de séance (ex: 4/6)

**Au centre :**
- **Chronomètre géant** : Temps écoulé (MM:SS ou H:MM:SS)
- Indicateur **"EN PAUSE"** si en pause

**Sous le chronomètre :**
- Badges des paramètres laser configurés

**Bouton rond :**
- **Pause** (icône pause) : Met le chronomètre en pause
- **Play** (icône lecture) : Reprend le chronomètre

### Tiroir d'actions (drawer)

En bas de l'écran, un tiroir coulissant permet d'accéder aux actions.

![Tiroir actions](./screenshots/praticien/09-active-drawer.png)

**Tirez vers le haut** pour ouvrir le tiroir.

#### Boutons d'action rapide

| Bouton | Action |
|--------|--------|
| **Photo** | Prendre une photo avec l'appareil |
| **Effet** | Signaler un effet secondaire |
| **Note** | Ajouter une note |

#### Formulaire effet secondaire

![Effet secondaire](./screenshots/praticien/10-side-effect-form.png)

1. Cliquez sur **"Effet"**
2. Saisissez la description
3. Sélectionnez la sévérité :
   - **Léger** : Réaction normale
   - **Modéré** : Réaction plus importante
   - **Sévère** : Nécessite attention médicale
4. Cliquez sur **"Ajouter"**

#### Formulaire note

1. Cliquez sur **"Note"**
2. Saisissez votre observation
3. Cliquez sur **"Ajouter"**

#### Photos capturées

Les photos prises s'affichent en miniature. Cliquez sur la corbeille pour supprimer.

#### Effets enregistrés

Liste des effets secondaires avec leur sévérité (badge coloré).

### Terminer la séance

1. Ouvrez le tiroir
2. Cliquez sur **"Terminer la séance"**

![Confirmation fin](./screenshots/praticien/11-end-confirm.png)

3. Un dialogue de confirmation apparaît
4. Cliquez sur **"Confirmer"**

**Séance multi-zones :**

Si plusieurs zones ont été sélectionnées, après la première zone :
- Un toast affiche "Zone suivante: [nom]"
- Le chronomètre repart à zéro
- Répétez pour chaque zone

Après la dernière zone :
- Toast "Séance terminée et sauvegardée"
- Retour automatique à la file d'attente

---

## 5. Workflow quotidien

### Début de journée

```
Connexion
    ↓
Sélection de cabine (optionnel)
    ↓
File d'attente
```

### Boucle de traitement

```
┌─────────────────────────────────────┐
│                                     │
│   File d'attente                    │
│        ↓                            │
│   Cliquer "Appeler" sur un patient  │
│        ↓                            │
│   Étape 1: Sélectionner les zones   │
│        ↓                            │
│   Étape 2: Configurer paramètres    │
│        ↓                            │
│   Étape 3: Confirmer                │
│        ↓                            │
│   "Démarrer la séance"              │
│        ↓                            │
│   Traitement (chronomètre actif)    │
│        ↓                            │
│   "Terminer la séance"              │
│        ↓                            │
│   (Si multi-zones → zone suivante)  │
│        ↓                            │
└──────── Retour file ────────────────┘
```

### Pendant la séance

1. **Surveiller** le chronomètre
2. **Mettre en pause** si interruption
3. **Photographier** si nécessaire (avant/après, réaction)
4. **Noter** tout effet secondaire immédiatement
5. **Ajouter** des observations textuelles

### Actions disponibles pendant la séance

| Action | Quand l'utiliser |
|--------|------------------|
| **Photo** | Documenter l'état avant/après, réaction cutanée |
| **Effet** | Toute réaction anormale (rougeur excessive, douleur) |
| **Note** | Observations générales, ajustements effectués |
| **Pause** | Interruption temporaire (question patient, incident) |

---

## Paramètres laser recommandés

### Par phototype

| Phototype | Type laser | Fluence recommandée |
|-----------|------------|---------------------|
| I-II | Alexandrite | Standard |
| III-IV | Alexandrite/Yag | Modérée |
| V-VI | Yag | Réduite |

> **Note** : Adaptez toujours selon l'historique du patient et les réactions précédentes.

---

## Situations particulières

### Patient non trouvé

Si "Patient introuvable" s'affiche :
1. Cliquez sur **"Retour"**
2. Vérifiez avec l'accueil

### Aucune zone avec séances restantes

Si le message "Aucune zone avec des séances restantes" s'affiche :
- Le patient a terminé toutes ses séances
- Retournez à la file d'attente

### Problème technique

1. Ne fermez pas l'onglet (la séance est en mémoire locale)
2. Actualisez la page si bloqué
3. Contactez l'administrateur

---

## Support

En cas de problème technique :
1. Vérifiez votre connexion internet
2. Actualisez la page
3. Contactez l'administrateur

---

*Documentation Optiskin v2.2.0 - Février 2026*
*Basée sur le code source frontend-v2*
