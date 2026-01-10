# SalonApp UX Roadmap v2

## Vision
Ultra-simple, thumb-friendly tablet app for laser clinic workflow.
**Goal:** 3 taps or less for any action.

---

## Workflows

### New Patient Flow (Wizard)
```
Step 1: CREATE        →  2 fields only (nom, prénom)
        ↓ auto
Step 2: QUESTIONNAIRE →  One question per screen
        ↓ auto
Step 3: ZONES         →  Body map tap to select
        ↓ auto
Step 4: READY         →  "Démarrer séance" or "Terminer"
```

### Returning Patient Flow
```
Search/tap patient → Patient card → "Démarrer séance" → Go
(2 taps max)
```

### Session Flow
```
Select zone → Params → START (timer) → END → Notes/Photo → Done
```

---

## Implementation Tasks

### 1. New Patient Wizard
- [ ] Convert `/patients/nouveau` to multi-step wizard
- [ ] Step 1: Nom + Prénom only (other fields optional/later)
- [ ] Step 2: Integrate QuestionnaireFlow component
- [ ] Step 3: Integrate BodyMap for zone selection
- [ ] Step 4: Summary + "Démarrer séance" button
- [ ] Progress indicator at top
- [ ] All buttons at bottom (thumb zone)

### 2. Patient Card Redesign
- [ ] Simplify `/patients/[id]` page
- [ ] Big prominent "Démarrer séance" button
- [ ] Less clutter, essential info only
- [ ] Quick access to zones and history

### 3. Session Flow Connection
- [ ] `/patients/[id]/seance` → Start timer on save
- [ ] Pass session data to `/seance-active`
- [ ] Wire EndSessionSheet with photo capture
- [ ] Wire VoiceNotes component
- [ ] Auto-return to patient after end

### 4. Layout & UX Polish
- [ ] All primary actions in bottom 60% of screen
- [ ] 48px+ touch targets everywhere
- [ ] Progress indicators for multi-step flows
- [ ] Reduce form fields to minimum required
- [ ] Add micro-interactions (haptics already done)

---

## Components Ready to Wire

| Component | Location | Status |
|-----------|----------|--------|
| QuestionnaireFlow | `components/features/questionnaire/` | Built |
| BodyMap | `components/features/zones/` | Built |
| EndSessionSheet | `components/features/capture/` | Built |
| PhotoCapture | `components/features/capture/` | Built |
| VoiceNotes | `components/features/capture/` | Built |

---

## Design Principles

1. **3-tap rule** - Any task in 3 taps or less
2. **Thumb zone** - Primary actions in bottom 60%
3. **Progressive disclosure** - Show only what's needed
4. **One thing at a time** - Wizard > long forms
5. **Auto-progress** - Move to next step automatically
6. **Forgiving** - Easy to go back, undo, edit

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Taps to create patient | 10+ | 4 |
| Taps to start session | 8+ | 2 |
| Time to complete new patient | 5+ min | <2 min |
