# Deployment Guide - SalonApp

## Server Information

- **IP Address**: 10.0.2.144
- **User**: sidali
- **Password**: S1D@liY3t*-
- **Access**: Requires WireGuard VPN

## VPN Configuration

The server is on a private network. You need WireGuard VPN to access it.

### WireGuard Config (~/.wireguard/wg0.conf)

```ini
[Interface]
PrivateKey = <your-private-key>
Address = 172.16.0.13/32
DNS = 10.0.2.13

[Peer]
PublicKey = lo83SB8lMExrtuaXfyxiK+d+sLLM8XHIEw0cx5zSUSY=
AllowedIPs = 172.16.0.0/29, 10.0.2.0/23
Endpoint = val.cduval.org:51820
```

### Connect/Disconnect VPN

```bash
# Connect
sudo wg-quick up ~/.wireguard/wg0.conf

# Disconnect
sudo wg-quick down ~/.wireguard/wg0.conf

# Check status
sudo wg show
```

## Application URLs

- **App**: http://10.0.2.144
- **API**: http://10.0.2.144/api/v1

## Default Credentials

- **Admin Username**: admin
- **Admin Password**: admin123

## Deployment Commands

### Prerequisites

Install sshpass for non-interactive SSH:
```bash
brew install hudochenkov/sshpass/sshpass
```

### Quick Deploy (All Services)

```bash
# Sync all files
sshpass -p 'S1D@liY3t*-' rsync -avz \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='__pycache__' \
  --exclude='.venv' \
  --exclude='.next' \
  --exclude='dist' \
  . sidali@10.0.2.144:/home/sidali/salonapp/

# SSH into server and rebuild
sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose build && docker compose up -d"
```

### Deploy Backend Only

```bash
sshpass -p 'S1D@liY3t*-' rsync -avz \
  --exclude='__pycache__' --exclude='.venv' \
  backend/ sidali@10.0.2.144:/home/sidali/salonapp/backend/

sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose build backend && docker compose up -d backend"
```

### Deploy Frontend Only

```bash
sshpass -p 'S1D@liY3t*-' rsync -avz \
  --exclude='node_modules' --exclude='dist' \
  frontend-v2/ sidali@10.0.2.144:/home/sidali/salonapp/frontend-v2/

sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose build frontend && docker compose up -d frontend"
```

## Database Operations

### Run Migrations

```bash
sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose run --rm backend alembic upgrade head"
```

### Seed Database

```bash
sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose exec backend python -m src.db.seed"
```

### Database Backup

```bash
sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose exec db pg_dump -U salonapp salonapp > backup_$(date +%Y%m%d).sql"
```

## Monitoring

### Check Container Status

```bash
sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose ps"
```

### View Logs

```bash
# All services
sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose logs -f --tail=50"

# Specific service
sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose logs -f backend"
```

### Restart Services

```bash
sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "cd /home/sidali/salonapp && docker compose restart"
```

## Environment Variables

The following environment variables are configured in `docker-compose.yml`:

| Variable | Description | Default |
|----------|-------------|---------|
| DB_PASSWORD | PostgreSQL password | salonapp_secret |
| SECRET_KEY | JWT signing key | (random in dev) |
| ADMIN_USERNAME | Initial admin user | admin |
| ADMIN_PASSWORD | Initial admin password | admin123 |
| SECURE_COOKIES | Use secure cookies (HTTPS) | false |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    nginx (port 80)                   │
├─────────────────────────────────────────────────────┤
│  /api/*  →  backend:8420                            │
│  /*      →  frontend:3001                           │
└─────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│    Backend      │    │    Frontend     │
│  FastAPI:8420   │    │   Nginx:3001    │
│                 │    │   (Vite build)  │
└────────┬────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│     :5432       │
└─────────────────┘
```

## CI/CD with GitHub Actions

Automatic deployment is configured via `.github/workflows/deploy.yml`.

### Required GitHub Secrets

Go to **Settings > Secrets and variables > Actions** and add:

| Secret | Description | How to get |
|--------|-------------|------------|
| `WG_PRIVATE_KEY` | WireGuard private key for CI | Generate new key pair (see below) |
| `SERVER_SSH_KEY` | SSH private key for server access | Generate ed25519 key (see below) |

### Setup Steps

#### 1. Generate WireGuard key pair for CI

```bash
# Generate new key pair
wg genkey | tee ci-private.key | wg pubkey > ci-public.key

# Show private key (add to GitHub Secrets as WG_PRIVATE_KEY)
cat ci-private.key

# Show public key (send to VPN admin to add as peer)
cat ci-public.key
```

Ask the backend team to add the CI public key as a new peer with address `172.16.0.14/32`.

#### 2. Generate SSH key for CI

```bash
# Generate SSH key
ssh-keygen -t ed25519 -f ci-ssh-key -N ""

# Show private key (add to GitHub Secrets as SERVER_SSH_KEY)
cat ci-ssh-key

# Add public key to server
sshpass -p 'S1D@liY3t*-' ssh sidali@10.0.2.144 \
  "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys" < ci-ssh-key.pub
```

#### 3. Add secrets to GitHub

1. Go to https://github.com/Temkit/cmdval_salonapp/settings/secrets/actions
2. Click "New repository secret"
3. Add `WG_PRIVATE_KEY` with the WireGuard private key
4. Add `SERVER_SSH_KEY` with the SSH private key

### Trigger Deployments

**Automatic**: Push to `main` branch (only deploys changed services)

**Manual**:
1. Go to Actions tab
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Choose service (all/backend/frontend)

### Workflow Features

- Connects to VPN via WireGuard
- Detects which services changed
- Syncs only changed files via rsync
- Builds and deploys Docker containers
- Runs database migrations for backend changes
- Health check after deployment
- Auto-disconnects VPN on completion

## Troubleshooting

### Auth not working (401 errors after login)
- Check `SECURE_COOKIES` is `false` when using HTTP
- Clear browser cookies and retry

### Database connection errors
- Wait for db healthcheck: `docker compose logs db`
- Run migrations: `alembic upgrade head`

### Frontend not loading
- Check nginx logs: `docker compose logs nginx`
- Verify frontend built: `docker compose logs frontend`

### CI/CD VPN connection fails
- Verify WireGuard key was added as peer by VPN admin
- Check the endpoint `val.cduval.org:51820` is reachable
- Ensure CI address `172.16.0.14/32` doesn't conflict with other peers

### CI/CD SSH fails
- Verify public key was added to `~/.ssh/authorized_keys` on server
- Check SSH key format (should be ed25519 or RSA)
