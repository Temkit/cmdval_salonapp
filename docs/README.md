# Documentation Optiskin

## Guides Utilisateurs

Cette documentation contient les manuels d'utilisation pour chaque rôle du système Optiskin.

### Guides disponibles

| Guide | Description | Rôle |
|-------|-------------|------|
| [Guide Administrateur](./guide-utilisateur-admin.md) | Configuration, gestion complète du système | Admin |
| [Guide Secrétaire](./guide-utilisateur-secretaire.md) | Accueil, file d'attente, pré-consultations | Secrétaire |
| [Guide Praticien](./guide-utilisateur-praticien.md) | Réalisation des séances laser | Praticien |

---

## Workflows par rôle

### Administrateur

```
Tableau de bord → File d'attente → Patients → Pré-consultations → Configuration
```

**Responsabilités principales :**
- Validation des pré-consultations
- Configuration des zones, packs, promotions
- Gestion des utilisateurs et rôles
- Supervision globale du centre

### Secrétaire

```
File d'attente → Ajouter patient → Pré-consultation → Soumettre
```

**Responsabilités principales :**
- Accueil des patients
- Gestion de la file d'attente
- Création des pré-consultations
- Suivi des patients

### Praticien

```
Sélection cabine → File d'attente → Appeler patient → Séance → Terminer
```

**Responsabilités principales :**
- Réalisation des séances laser
- Documentation des traitements
- Suivi des paramètres laser
- Signalement des effets secondaires

---

## Structure des captures d'écran

Les captures d'écran doivent être placées dans les dossiers suivants :

```
docs/
├── screenshots/
│   ├── admin/           # Captures pour le guide admin
│   │   ├── 01-login.png
│   │   ├── 02-dashboard.png
│   │   └── ...
│   ├── secretaire/      # Captures pour le guide secrétaire
│   │   ├── 01-login.png
│   │   ├── 02-queue.png
│   │   └── ...
│   └── praticien/       # Captures pour le guide praticien
│       ├── 01-login.png
│       ├── 02-select-box.png
│       └── ...
```

### Liste des captures requises

#### Admin (21 captures)
1. `01-login.png` - Écran de connexion
2. `02-dashboard.png` - Tableau de bord
3. `03-queue.png` - File d'attente
4. `04-queue-add.png` - Ajouter à la file
5. `05-patients-list.png` - Liste des patients
6. `06-patient-create.png` - Créer un patient
7. `07-patient-detail.png` - Fiche patient
8. `08-patient-add-zone.png` - Ajouter zone au patient
9. `09-preconsult-list.png` - Liste pré-consultations
10. `10-preconsult-detail.png` - Détail pré-consultation
11. `11-preconsult-reject.png` - Refuser pré-consultation
12. `12-preconsult-create-patient.png` - Créer patient depuis pré-consult
13. `13-config-menu.png` - Menu configuration
14. `14-config-zones.png` - Configuration zones
15. `15-config-packs.png` - Configuration packs
16. `16-config-promotions.png` - Configuration promotions
17. `17-config-boxes.png` - Configuration cabines
18. `18-config-questionnaire.png` - Configuration questionnaire
19. `19-config-roles.png` - Configuration rôles
20. `20-config-users.png` - Gestion utilisateurs
21. `21-user-create.png` - Créer utilisateur

#### Secrétaire (22 captures)
1. `01-login.png` - Écran de connexion
2. `02-queue.png` - File d'attente
3. `03-queue-search.png` - Recherche patient
4. `04-queue-card.png` - Carte patient dans file
5. `05-queue-notification.png` - Notification temps réel
6. `06-patients-list.png` - Liste patients
7. `07-patient-detail.png` - Fiche patient
8. `08-patient-zones.png` - Zones du patient
9. `09-patient-edit.png` - Modifier patient
10. `10-preconsult-intro.png` - Introduction pré-consultation
11. `11-preconsult-patient.png` - Étape patient
12. `12-preconsult-demo.png` - Étape démographiques
13. `13-preconsult-contraind.png` - Étape contre-indications
14. `14-preconsult-laser.png` - Étape historique laser
15. `15-preconsult-medical.png` - Étape antécédents
16. `16-preconsult-epilation.png` - Étape méthodes épilation
17. `17-preconsult-zones.png` - Étape zones
18. `18-preconsult-zone-ineligible.png` - Zone non éligible
19. `19-preconsult-submit.png` - Soumettre pré-consultation
20. `20-preconsult-list.png` - Liste pré-consultations
21. `21-preconsult-rejected.png` - Pré-consultation refusée
22. `22-workflow-arrival.png` - Workflow arrivée patient

#### Praticien (16 captures)
1. `01-login.png` - Écran de connexion
2. `02-select-box.png` - Sélection cabine
3. `03-box-indicator.png` - Indicateur cabine
4. `04-queue.png` - File d'attente
5. `05-queue-call.png` - Appeler patient
6. `06-seance-prep.png` - Préparation séance
7. `07-seance-zones.png` - Zones à traiter
8. `08-seance-select-zones.png` - Sélection zones
9. `09-seance-params.png` - Paramètres laser
10. `10-seance-start.png` - Lancer séance
11. `11-active-session.png` - Séance active
12. `12-session-observation.png` - Ajouter observation
13. `13-session-side-effect.png` - Signaler effet secondaire
14. `14-session-end.png` - Terminer séance
15. `15-session-summary.png` - Résumé séance
16. `16-workflow-start.png` - Workflow début journée

---

## Convention de nommage

- **Fichiers** : `XX-description-courte.png` (XX = numéro à 2 chiffres)
- **Format** : PNG recommandé
- **Résolution** : 1920x1080 ou 1280x720 minimum
- **Annotations** : Utiliser des flèches/encadrés si nécessaire

---

## Mise à jour de la documentation

Lors de modifications de l'interface :
1. Mettre à jour les captures d'écran concernées
2. Réviser le texte du guide si nécessaire
3. Vérifier les numéros de page/section
4. Mettre à jour la version en bas de chaque guide

---

*Documentation Optiskin v2.2.0 - Janvier 2026*
