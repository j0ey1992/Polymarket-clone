# Railway Deployment Guide

## Architecture on Railway

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAILWAY                                  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Frontend   │  │  Backend    │  │  PostgreSQL │             │
│  │  (Next.js)  │  │  (Node.js)  │  │  (Database) │             │
│  │  Port 3000  │  │  Port 3001  │  │  Port 5432  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         │                │                │                     │
│         │         ┌──────┴──────┐        │                     │
│         │         │    Redis    │        │                     │
│         │         │   (Cache)   │        │                     │
│         │         │  Port 6379  │        │                     │
│         │         └─────────────┘        │                     │
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘
```

## Quick Deploy

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

### 2. Add Services

In Railway Dashboard:
1. **Add PostgreSQL** → Click "New" → "Database" → "PostgreSQL"
2. **Add Redis** → Click "New" → "Database" → "Redis"
3. **Add Backend** → Click "New" → "GitHub Repo" → Select this repo → Set root to `/backend`
4. **Add Frontend** → Click "New" → "GitHub Repo" → Select this repo → Set root to `/`

### 3. Configure Environment Variables

#### Backend Service Variables:
```
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Polymarket API
POLYMARKET_CLOB_URL=https://clob.polymarket.com
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_WS_URL=wss://ws-subscriptions-clob.polymarket.com

# Your Polymarket wallet (for placing orders)
POLYMARKET_PRIVATE_KEY=your_private_key_here

# Cronos (optional - for smart contracts)
CRONOS_RPC_URL=https://evm.cronos.org
CRONOS_PRIVATE_KEY=your_cronos_key_here

# Security
JWT_SECRET=generate_a_secure_random_string_here
```

#### Frontend Service Variables:
```
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}/api
NEXT_PUBLIC_WS_URL=wss://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

### 4. Deploy

```bash
# Deploy everything
railway up
```

## Manual Setup Steps

### Step 1: Fork/Clone Repository

### Step 2: Railway Dashboard Setup

1. Go to [railway.app](https://railway.app)
2. Create New Project
3. Add services as described above

### Step 3: Link Services

Railway automatically provides connection URLs. Use variable references:
- `${{Postgres.DATABASE_URL}}` - PostgreSQL connection string
- `${{Redis.REDIS_URL}}` - Redis connection string

### Step 4: Run Initial Sync

After deployment, run the initial Polymarket sync:

```bash
# Connect to backend service
railway run -s backend npx ts-node src/scripts/sync.ts --full
```

## Domains

Railway provides free domains:
- Frontend: `your-app.up.railway.app`
- Backend: `your-app-backend.up.railway.app`

Custom domains can be added in Railway dashboard.
