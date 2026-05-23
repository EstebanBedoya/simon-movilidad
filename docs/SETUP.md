# Setup Guide — Simón Movilidad

Local deployment guide for the full-stack fleet monitoring system.

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | https://nodejs.org |
| pnpm | ≥ 10 | `npm install -g pnpm` |
| Docker + Docker Compose | Any recent | https://docker.com |

---

## 1. Clone the repository

```bash
git clone <repo-url>
cd simon-movilidad
```

---

## 2. Install dependencies

```bash
pnpm install
```

---

## 3. Configure environment variables

### Backend

```bash
cp apps/backend/.env.example apps/backend/.env
```

Default values in `.env` work out of the box with the Docker Compose database:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=simon
DB_PASSWORD=simon123
DB_NAME=simon_movilidad
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=86400
SIMULATE=true
SIMULATE_INTERVAL_MS=3000
PORT=3001
NODE_ENV=development
```

> **SIMULATE=true** starts a background vehicle simulation engine. Set to `false` if you want to send telemetry manually via the API.

### Frontend

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Default values:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

---

## 4. Start the database

```bash
cd infra
docker compose up -d
cd ..
```

This starts PostgreSQL 16 on port `5432`. The database schema is created automatically on first backend startup (TypeORM `synchronize: true` in development).

Wait for the healthcheck to pass before starting the backend:

```bash
docker compose -f infra/docker-compose.yml ps
# STATUS should show "healthy" for the postgres service
```

---

## 5. Start the backend

```bash
pnpm --filter @simon/backend dev
```

The NestJS server starts on `http://localhost:3001`.

On first start it will:
1. Connect to PostgreSQL and sync the schema (creates tables automatically)
2. Start the vehicle simulation engine if `SIMULATE=true`

You should see:

```
[NestFactory] Starting Nest application...
[Simon Movilidad] Listening on port 3001
[SimulationService] Started simulation for X vehicles
```

---

## 6. Start the frontend

In a separate terminal:

```bash
pnpm --filter @simon/web dev
```

The Next.js app starts on `http://localhost:3000`.

---

## 7. Run both apps together (Turborepo)

Alternatively, run everything from the root:

```bash
pnpm dev
```

This uses Turborepo to start backend and frontend in parallel.

---

## 8. First login

The simulation engine seeds vehicles automatically. Create a user via the register endpoint:

```bash
# Register an admin user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@simon.co","password":"admin123","role":"admin"}'

# Register a regular user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@simon.co","password":"user123"}'
```

Then log in at `http://localhost:3000/login`.

> **Admin users** see the full alert system, device IDs unmasked, and the `/alerts` page.  
> **Regular users** see masked device IDs (`DEV-****-XC54` format) and no alert panel.

---

## 9. Run tests

```bash
# All tests (backend + frontend)
pnpm test

# Backend only
pnpm --filter @simon/backend test

# Backend with coverage
pnpm --filter @simon/backend test:cov

# Frontend only
pnpm --filter @simon/web test

# Frontend with coverage
pnpm --filter @simon/web test:coverage
```

---

## API Reference

Base URL: `http://localhost:3001`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | None | Register user |
| `POST` | `/auth/login` | None | Login, returns JWT |
| `GET` | `/auth/me` | JWT | Current user |
| `GET` | `/vehicles` | JWT | List vehicles |
| `POST` | `/vehicles` | Admin | Create vehicle |
| `DELETE` | `/vehicles/:id` | Admin | Delete vehicle |
| `POST` | `/telemetry` | JWT | Ingest telemetry point |
| `GET` | `/telemetry/:vehicleId` | JWT | Get telemetry history |
| `GET` | `/alerts` | Admin | List alerts |
| `PATCH` | `/alerts/:id/resolve` | Admin | Resolve alert |

### WebSocket Namespaces

Connect with `Authorization: Bearer <token>` in `socket.handshake.auth`.

| Namespace | Event | Direction | Description |
|---|---|---|---|
| `/telemetry` | `vehicle:location` | Server → Client | Real-time vehicle position + metrics |
| `/alerts` | `alert:created` | Server → Client | New predictive alert (admin only) |

---

## Troubleshooting

**Database connection refused**  
Make sure Docker is running and the postgres container is healthy: `docker compose -f infra/docker-compose.yml ps`

**Port 3001 already in use**  
Change `PORT` in `apps/backend/.env` and `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` to match.

**Map not loading**  
The map tile server (`tiles.openfreemap.org`) requires an internet connection. No API key needed.

**No vehicles on the map**  
Check that `SIMULATE=true` in `apps/backend/.env` and that the backend started without errors. Vehicles are created automatically by the simulation engine on first run.
