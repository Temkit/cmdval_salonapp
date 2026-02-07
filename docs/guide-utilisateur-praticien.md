# Guide Utilisateur - Praticien

## Optiskin - Manuel d'utilisation pour les Praticiens

---

## Table des matières

1. [Connexion et sélection de cabine](#1-connexion-et-sélection-de-cabine)
2. [File d'attente](#2-file-dattente)
3. [Réalisation d'une séance](#3-réalisation-dune-séance)
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

Après connexion, vous devez choisir votre cabine de travail.

![Sélection cabine](./screenshots/praticien/02-select-box.png)

1. La grille affiche toutes les cabines disponibles
2. Chaque cabine indique son statut :
   - **Disponible** (vert) : Vous pouvez la sélectionner
   - **Occupée** (gris + nom) : Un autre praticien l'utilise
   - **Votre cabine** (bordure bleue) : Cabine actuellement sélectionnée

3. Cliquez sur une cabine **disponible**
4. Vous êtes redirigé vers la file d'attente

> **Note** : Vous pouvez changer de cabine à tout moment via le menu.

### Indicateur de cabine

Une fois la cabine sélectionnée, son numéro s'affiche dans l'en-tête.

![Indicateur cabine](./screenshots/praticien/03-box-indicator.png)

---

## 2. File d'attente

La file d'attente affiche les patients prêts pour leur séance.

### Vue d'ensemble

![File d'attente praticien](./screenshots/praticien/04-queue.png)

### Comprendre la file

Chaque carte patient affiche :

| Information | Description |
|-------------|-------------|
| **Nom** | Nom et prénom du patient |
| **Photo** | Photo du patient (si disponible) |
| **Zones** | Zones à traiter avec séances restantes |
| **Attente** | Temps écoulé depuis l'arrivée |
| **Phototype** | Type de peau (I à VI) |

### Appeler un patient

1. Repérez le patient suivant dans la file
2. Cliquez sur le bouton **"Appeler"**

![Appeler patient](./screenshots/praticien/05-queue-call.png)

3. Le patient est assigné à votre cabine
4. Vous êtes redirigé vers l'écran de séance

> **Conseil** : Respectez l'ordre de la file sauf indication contraire.

---

## 3. Réalisation d'une séance

### Écran de préparation de séance

Après avoir appelé un patient, vous voyez l'écran de préparation.

![Préparation séance](./screenshots/praticien/06-seance-prep.png)

### Informations patient

En haut de l'écran :
- **Nom et prénom**
- **Âge et phototype**
- **Photo** du patient
- **Alertes** éventuelles (contre-indications, notes)

### Zones à traiter

La liste affiche les zones du patient :

![Zones à traiter](./screenshots/praticien/07-seance-zones.png)

Pour chaque zone :
- **Nom de la zone**
- **Progression** : X / Y séances (ex: 3/6)
- **Case à cocher** : Sélectionner pour cette séance

#### Sélectionner les zones

1. Cochez les zones à traiter aujourd'hui
2. Les zones déjà terminées (6/6) sont grisées

![Sélection zones](./screenshots/praticien/08-seance-select-zones.png)

### Paramètres laser

Pour chaque zone sélectionnée, configurez les paramètres :

![Paramètres laser](./screenshots/praticien/09-seance-params.png)

| Paramètre | Description |
|-----------|-------------|
| **Fluence** | Énergie en J/cm² |
| **Spot size** | Taille du spot |
| **Fréquence** | Fréquence des impulsions |
| **Durée d'impulsion** | En millisecondes |

> **Note** : Les paramètres recommandés s'affichent selon le phototype.

### Lancer la séance

1. Vérifiez les zones sélectionnées
2. Vérifiez les paramètres laser
3. Cliquez sur **"Démarrer la séance"**

![Lancer séance](./screenshots/praticien/10-seance-start.png)

---

## 4. Séance active

### Écran de séance en cours

![Séance active](./screenshots/praticien/11-active-session.png)

L'écran affiche :
- **Timer** : Temps écoulé depuis le début
- **Patient** : Informations du patient
- **Zones en cours** : Liste des zones sélectionnées

### Pendant le traitement

#### Ajouter des observations

Pendant la séance, vous pouvez noter des observations :

1. Cliquez sur **"+ Observation"**
2. Sélectionnez le type :
   - Réaction cutanée
   - Douleur signalée
   - Autre

![Ajouter observation](./screenshots/praticien/12-session-observation.png)

3. Ajoutez un commentaire si nécessaire
4. Validez

#### Signaler un effet secondaire

En cas d'effet secondaire :

1. Cliquez sur **"Signaler un effet"**
2. Sélectionnez la sévérité :
   - **Léger** : Rougeur normale
   - **Modéré** : Réaction plus importante
   - **Sévère** : Nécessite attention médicale

![Effet secondaire](./screenshots/praticien/13-session-side-effect.png)

3. Décrivez l'effet
4. Validez

> **Important** : Les effets sévères déclenchent une alerte automatique.

### Terminer la séance

Quand le traitement est fini :

1. Cliquez sur **"Terminer la séance"**

![Terminer séance](./screenshots/praticien/14-session-end.png)

2. Confirmez la finalisation

### Écran de résumé

Après validation, un résumé s'affiche :

![Résumé séance](./screenshots/praticien/15-session-summary.png)

- **Zones traitées** avec les paramètres utilisés
- **Durée** de la séance
- **Observations** enregistrées
- **Prochaine séance** recommandée

### Retour à la file

Cliquez sur **"Patient suivant"** pour retourner à la file d'attente.

---

## 5. Workflow quotidien

### Début de journée

```
Connexion
    ↓
Sélection de cabine
    ↓
Vérifier la file d'attente
    ↓
Préparer le matériel
```

![Workflow début](./screenshots/praticien/16-workflow-start.png)

### Boucle de traitement

```
┌─────────────────────────────┐
│                             │
│   Appeler patient suivant   │
│            ↓                │
│   Vérifier informations     │
│            ↓                │
│   Sélectionner les zones    │
│            ↓                │
│   Configurer paramètres     │
│            ↓                │
│   Réaliser le traitement    │
│            ↓                │
│   Noter les observations    │
│            ↓                │
│   Terminer la séance        │
│            ↓                │
└──────── Répéter ────────────┘
```

### Pendant les séances

#### Avant chaque patient

1. **Lire** les informations patient (phototype, antécédents)
2. **Vérifier** les contre-indications
3. **Confirmer** les zones à traiter
4. **Adapter** les paramètres si nécessaire

#### Pendant le traitement

1. **Surveiller** les réactions cutanées
2. **Ajuster** les paramètres si besoin
3. **Noter** toute observation importante
4. **Rassurer** le patient

#### Après le traitement

1. **Donner** les consignes post-séance
2. **Planifier** le prochain rendez-vous
3. **Documenter** la séance

### Fin de journée

1. Terminer toutes les séances en cours
2. Vérifier que la file est vide
3. Nettoyer la cabine
4. Se déconnecter

---

## Bonnes pratiques

### Sécurité patient

| Vérification | Action |
|--------------|--------|
| Phototype | Adapter les paramètres |
| Contre-indications | Ne pas traiter si présentes |
| Historique | Vérifier les réactions précédentes |
| Consentement | S'assurer qu'il est signé |

### Paramètres laser

#### Par phototype

| Phototype | Fluence recommandée | Précautions |
|-----------|---------------------|-------------|
| I-II | Standard | Risque de brûlure faible |
| III-IV | Réduite | Adapter progressivement |
| V-VI | Très réduite | Surveillance accrue |

### Documentation

- **Notez** systématiquement les paramètres utilisés
- **Signalez** tout effet inhabituel
- **Photographiez** les zones si nécessaire (avant/après)

---

## Situations particulières

### Patient avec contre-indication découverte

1. **Arrêtez** immédiatement la préparation
2. **Informez** le patient
3. **Signalez** à l'accueil
4. **Retournez** le patient à la file ou annulez

### Réaction allergique pendant traitement

1. **Arrêtez** le traitement
2. **Évaluez** la situation
3. **Appelez** de l'aide si nécessaire
4. **Documentez** l'incident

### Problème technique

1. **Sauvegardez** la séance en cours si possible
2. **Informez** le support technique
3. **Notez** manuellement les informations

---

## Raccourcis

| Action | Raccourci |
|--------|-----------|
| Retour file | Clic logo Optiskin |
| Changer cabine | Menu → Changer cabine |

---

## Support

En cas de problème technique :
1. Vérifiez votre connexion
2. Actualisez la page
3. Contactez l'administrateur

En cas d'urgence médicale :
- Suivez les protocoles du centre
- Documentez l'incident après résolution

---

*Documentation Optiskin v2.2.0 - Janvier 2026*
