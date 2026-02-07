# SalonApp - Complete API & UI Coverage

## User Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **Admin** | Full system access | All permissions |
| **Secrétaire** | Patient management, scheduling | patients.*, pre_consultations.*, zones.view |
| **Praticien** | Session execution | sessions.*, patients.view, boxes.* |

---

## Pages by Role

### Public Pages (No Auth)

| Route | Page | API Calls |
|-------|------|-----------|
| `/login` | Login | `POST /auth/login` |
| `/display` | Queue Display | `GET /schedule/queue/display` |

### Admin Pages

| Route | Page | API Calls |
|-------|------|-----------|
| `/admin` | Dashboard | `GET /dashboard/stats`, `GET /dashboard/revenue`, `GET /dashboard/recent-activity`, `GET /dashboard/sessions/by-zone`, `GET /dashboard/sessions/by-praticien`, `GET /dashboard/doctor-performance`, `GET /dashboard/sessions/by-period`, `GET /dashboard/side-effects`, `GET /dashboard/demographics` |
| `/admin/queue` | Queue Management | `GET /schedule/queue`, `PUT /schedule/queue/{id}/call`, `PUT /schedule/queue/{id}/complete`, `PUT /schedule/queue/{id}/no-show`, `PUT /schedule/queue/{id}/left`, `PUT /schedule/queue/{id}/reassign`, `GET /users` |
| `/admin/agenda` | Schedule | `GET /schedule/today`, `GET /schedule/{date}`, `POST /schedule/{id}/check-in`, `POST /schedule/manual`, `POST /schedule/upload` |
| `/admin/patients` | Patient List | `GET /patients` |
| `/admin/patients/nouveau` | New Patient | Redirect to pre-consultation |
| `/admin/patients/$id` | Patient Detail | `GET /patients/{id}`, `GET /patients/{id}/alerts`, `GET /patients/{id}/sessions`, `GET /paiements/patients/{id}`, `GET /packs/patients/{id}/subscriptions`, `GET /zones`, `GET /packs`, `POST /patients/{id}/zones`, `PUT /patients/{id}/zones/{zone_id}`, `DELETE /patients/{id}/zones/{zone_id}`, `POST /packs/patients/{id}/subscriptions`, `GET /documents/patients/{id}/documents/consent`, `GET /documents/patients/{id}/documents/rules`, `GET /documents/patients/{id}/documents/precautions`, `GET /documents/patients/{id}/qr-code` |
| `/admin/pre-consultations` | Pre-Consultation List | `GET /pre-consultations` |
| `/admin/pre-consultations/nouveau` | New Pre-Consultation | `GET /patients`, `GET /zones`, `POST /patients`, `POST /pre-consultations`, `GET /questionnaire/questions` |
| `/admin/pre-consultations/$id` | Pre-Consultation Detail | `GET /pre-consultations/{id}`, `PUT /pre-consultations/{id}`, `POST /pre-consultations/{id}/zones`, `PUT /pre-consultations/{id}/zones/{zone_id}`, `DELETE /pre-consultations/{id}/zones/{zone_id}`, `POST /pre-consultations/{id}/submit`, `POST /pre-consultations/{id}/validate`, `POST /pre-consultations/{id}/reject`, `POST /pre-consultations/{id}/create-patient`, `GET /pre-consultations/{id}/questionnaire`, `PUT /pre-consultations/{id}/questionnaire`, `GET /zones`, `GET /packs` |
| `/admin/paiements` | Payments | `GET /paiements`, `POST /paiements`, `GET /patients` |
| `/admin/config/users` | User Management | `GET /users`, `GET /roles`, `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}` |
| `/admin/config/zones` | Zone Config | `GET /zones`, `POST /zones`, `PUT /zones/{id}`, `DELETE /zones/{id}` |
| `/admin/config/packs` | Pack Config | `GET /packs`, `POST /packs`, `PUT /packs/{id}`, `DELETE /packs/{id}` |
| `/admin/config/promotions` | Promotion Config | `GET /promotions`, `POST /promotions`, `PUT /promotions/{id}`, `DELETE /promotions/{id}` |
| `/admin/config/questionnaire` | Questionnaire Config | `GET /questionnaire/questions`, `POST /questionnaire/questions`, `PUT /questionnaire/questions/{id}`, `DELETE /questionnaire/questions/{id}`, `PUT /questionnaire/questions/order` |
| `/admin/config/roles` | Role Config | `GET /roles`, `GET /roles/permissions`, `POST /roles`, `PUT /roles/{id}`, `DELETE /roles/{id}` |
| `/admin/config/boxes` | Box Config | `GET /boxes`, `POST /boxes`, `PUT /boxes/{id}`, `DELETE /boxes/{id}` |

### Secretary Pages

| Route | Page | API Calls |
|-------|------|-----------|
| `/secretary` | Dashboard | Same as admin queue |
| `/secretary/agenda` | Schedule | Same as admin agenda |
| `/secretary/patients` | Patient List | `GET /patients` |
| `/secretary/patients/nouveau` | New Patient | Redirect to pre-consultation |
| `/secretary/patients/$id` | Patient Detail | Same as admin patient detail |
| `/secretary/pre-consultations` | Pre-Consultation List | `GET /pre-consultations` |
| `/secretary/pre-consultations/nouveau` | New Pre-Consultation | Same as admin |
| `/secretary/pre-consultations/$id` | Pre-Consultation Detail | Same as admin |
| `/secretary/paiements` | Payments | `GET /paiements`, `POST /paiements`, `GET /patients` |

### Practitioner Pages

| Route | Page | API Calls |
|-------|------|-----------|
| `/practitioner` | Queue View | `GET /schedule/queue` (filtered by doctor_id) |
| `/practitioner/active` | Active Session | `POST /documents/temp-photo`, `DELETE /documents/temp-photo/{id}`, `POST /patients/{id}/sessions`, `PUT /schedule/queue/{id}/complete`, `GET /sessions/last-params`, `GET /sessions/laser-types` |
| `/practitioner/select-box` | Box Selection | `GET /boxes/my`, `GET /boxes`, `POST /boxes/assign`, `DELETE /boxes/assign` |
| `/practitioner/seance/$patientId` | Patient Workflow | `GET /patients/{id}`, `GET /patients/{id}/zones`, `GET /patients/{id}/alerts`, `GET /sessions/last-params`, `GET /sessions/laser-types`, `POST /patients/{id}/sessions`, `POST /patients/{id}/zones` |

---

## API Endpoints Summary

### Authentication (`/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login with username/password |
| POST | `/logout` | Logout (clear session) |
| GET | `/me` | Get current user info |
| PUT | `/password` | Change password |

### Users (`/users`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List users | `users.view` |
| POST | `/` | Create user | `users.manage` |
| GET | `/{id}` | Get user | `users.view` |
| PUT | `/{id}` | Update user | `users.manage` |
| DELETE | `/{id}` | Delete user | `users.manage` |

### Roles (`/roles`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List roles | `roles.view` |
| GET | `/permissions` | List permissions | `roles.view` |
| POST | `/` | Create role | `roles.manage` |
| GET | `/{id}` | Get role | `roles.view` |
| PUT | `/{id}` | Update role | `roles.manage` |
| DELETE | `/{id}` | Delete role | `roles.manage` |

### Patients (`/patients`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List patients (paginated, searchable) | `patients.view` |
| POST | `/` | Create patient | `patients.edit` |
| GET | `/{id}` | Get patient detail | `patients.view` |
| PUT | `/{id}` | Update patient | `patients.edit` |
| DELETE | `/{id}` | Delete patient | `patients.delete` |
| GET | `/by-card/{code}` | Get by barcode | `patients.view` |
| GET | `/{id}/zones` | List patient zones | `patients.view` |
| POST | `/{id}/zones` | Add zone | `zones.manage` |
| PUT | `/{id}/zones/{zone_id}` | Update zone | `zones.manage` |
| DELETE | `/{id}/zones/{zone_id}` | Remove zone | `zones.manage` |
| GET | `/{id}/alerts` | Get alerts | `patients.view` |
| GET | `/{id}/alerts/summary` | Alerts summary | `patients.view` |

### Sessions (`/patients/{id}/sessions`, `/sessions`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/patients/{id}/sessions` | List patient sessions | `sessions.view` |
| POST | `/patients/{id}/sessions` | Create session | `sessions.create` |
| GET | `/sessions/{id}` | Get session detail | `sessions.view` |
| GET | `/sessions/last-params` | Get last parameters | `sessions.view` |
| GET | `/sessions/laser-types` | List laser types | `sessions.view` |

### Pre-Consultations (`/pre-consultations`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List (paginated, filterable) | `pre_consultations.view` |
| POST | `/` | Create | `pre_consultations.create` |
| GET | `/{id}` | Get detail | `pre_consultations.view` |
| PUT | `/{id}` | Update | `pre_consultations.edit` |
| DELETE | `/{id}` | Delete | `pre_consultations.delete` |
| POST | `/{id}/submit` | Submit for validation | `pre_consultations.edit` |
| POST | `/{id}/validate` | Validate | `pre_consultations.validate` |
| POST | `/{id}/reject` | Reject | `pre_consultations.validate` |
| POST | `/{id}/create-patient` | Create patient from PC | `patients.edit` |
| POST | `/{id}/zones` | Add zone | `pre_consultations.edit` |
| PUT | `/{id}/zones/{zone_id}` | Update zone | `pre_consultations.edit` |
| DELETE | `/{id}/zones/{zone_id}` | Remove zone | `pre_consultations.edit` |
| GET | `/{id}/questionnaire` | Get questionnaire | `pre_consultations.view` |
| PUT | `/{id}/questionnaire` | Update questionnaire | `pre_consultations.edit` |
| GET | `/stats/pending-count` | Pending count | `pre_consultations.view` |

### Zones (`/zones`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List zones | `zones.view` |
| POST | `/` | Create zone | `config.questionnaire` |
| GET | `/{id}` | Get zone | `zones.view` |
| PUT | `/{id}` | Update zone | `config.questionnaire` |
| DELETE | `/{id}` | Delete zone | `config.questionnaire` |

### Questionnaire (`/questionnaire`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/questions` | List questions | `patients.questionnaire.view` |
| POST | `/questions` | Create question | `config.questionnaire` |
| GET | `/questions/{id}` | Get question | `patients.questionnaire.view` |
| PUT | `/questions/{id}` | Update question | `config.questionnaire` |
| DELETE | `/questions/{id}` | Delete question | `config.questionnaire` |
| PUT | `/questions/order` | Reorder questions | `config.questionnaire` |

### Packs (`/packs`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List packs | Authenticated |
| POST | `/` | Create pack | `config.manage` |
| PUT | `/{id}` | Update pack | `config.manage` |
| DELETE | `/{id}` | Delete pack | `config.manage` |
| GET | `/patients/{id}/subscriptions` | List subscriptions | Authenticated |
| POST | `/patients/{id}/subscriptions` | Create subscription | Authenticated |

### Promotions (`/promotions`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List promotions | Authenticated |
| GET | `/active` | List active | Authenticated |
| POST | `/` | Create promotion | `config.manage` |
| PUT | `/{id}` | Update promotion | `config.manage` |
| DELETE | `/{id}` | Delete promotion | `config.manage` |
| GET | `/zones/{id}/price` | Get discounted price | Authenticated |

### Payments (`/paiements`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List payments | Authenticated |
| POST | `/` | Create payment | Authenticated |
| GET | `/patients/{id}` | Patient payments | Authenticated |
| GET | `/stats` | Revenue stats | Authenticated |

### Boxes (`/boxes`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/` | List boxes | `boxes.view` |
| POST | `/` | Create box | `config.boxes` |
| PUT | `/{id}` | Update box | `config.boxes` |
| DELETE | `/{id}` | Delete box | `config.boxes` |
| POST | `/assign` | Assign box to self | Authenticated |
| DELETE | `/assign` | Unassign box | Authenticated |
| GET | `/my` | Get my box | Authenticated |

### Schedule (`/schedule`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/today` | Today's schedule | Authenticated |
| GET | `/{date}` | Schedule for date | Authenticated |
| POST | `/upload` | Upload Excel | Authenticated |
| POST | `/manual` | Manual entry | Authenticated |
| POST | `/{id}/check-in` | Check in patient | Authenticated |
| GET | `/queue` | Current queue | Authenticated |
| GET | `/queue/display` | Public display | None |
| GET | `/queue/events` | SSE stream | None |
| PUT | `/queue/{id}/call` | Call patient | Authenticated |
| PUT | `/queue/{id}/complete` | Complete | Authenticated |
| PUT | `/queue/{id}/no-show` | Mark no-show | Authenticated |
| PUT | `/queue/{id}/left` | Mark left | Authenticated |
| PUT | `/queue/{id}/reassign` | Reassign | Authenticated |

### Dashboard (`/dashboard`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/stats` | Overview stats | `dashboard.view` |
| GET | `/sessions/by-zone` | Sessions by zone | `dashboard.view` |
| GET | `/sessions/by-praticien` | Sessions by practitioner | `dashboard.view` |
| GET | `/sessions/by-period` | Sessions by period | `dashboard.view` |
| GET | `/recent-activity` | Recent activity | `dashboard.view` |
| GET | `/side-effects` | Side effect stats | `dashboard.view` |
| GET | `/doctor-performance` | Doctor performance | `dashboard.view` |
| GET | `/revenue` | Revenue stats | `dashboard.view` |
| GET | `/lost-time` | Lost time stats | `dashboard.view` |
| GET | `/demographics` | Demographics | `dashboard.view` |

### Documents (`/documents`)
| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/patients/{id}/documents/consent` | Consent PDF | Authenticated |
| GET | `/patients/{id}/documents/rules` | Rules PDF | Authenticated |
| GET | `/patients/{id}/documents/precautions` | Precautions PDF | Authenticated |
| GET | `/patients/{id}/qr-code` | QR Code PNG | Authenticated |
| POST | `/temp-photo` | Upload temp photo | Authenticated |
| GET | `/temp-photo/{id}` | Get temp photo | Authenticated |
| DELETE | `/temp-photo/{id}` | Delete temp photo | Authenticated |

---

## UI Components

### Core Components (`/components/ui/`)
- `Button` - Primary action element
- `Input` - Text input field
- `Label` - Form field label
- `Card` - Content container
- `Badge` - Status indicators
- `Dialog` - Modal dialogs
- `Select` - Dropdown selection
- `Tabs` - Tabbed interface
- `Progress` - Progress bar
- `Spinner` - Loading indicator
- `ConfirmDialog` - Delete confirmation
- `DatePicker` - Date selection
- `EmptyState` - Empty list state
- `Toast` - Notifications
- `Textarea` - Multi-line input

### Feature Components (`/components/`)
- `ChangePasswordDialog` - Password change modal
- `PatientWorkflowStepper` - Pre-consultation workflow steps

---

## Test Coverage

### Running Tests

Tests require a running PostgreSQL database with seeded admin user:

```bash
cd backend

# Option 1: Against local Docker database
docker compose up -d db
docker compose run --rm backend alembic upgrade head

DATABASE_URL="postgresql+asyncpg://salonapp:salonapp_secret@localhost:5432/salonapp" \
SECRET_KEY="test-secret" \
PYTHONPATH=. pytest tests/integration/test_full_api.py -v

# Option 2: Against deployed server (requires VPN)
DATABASE_URL="postgresql+asyncpg://salonapp:salonapp_secret@10.0.2.144:5432/salonapp" \
SECRET_KEY="production-secret-from-env" \
PYTHONPATH=. pytest tests/integration/test_full_api.py -v
```

**Total: 85+ test cases** covering:
- All CRUD operations
- Workflow transitions
- Permission checks
- Edge cases
