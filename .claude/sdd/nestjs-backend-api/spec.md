# Spec: Simon Movilidad Backend API
**change-name**: nestjs-backend-api
**project**: simon-movilidad
**date**: 2026-05-20
**status**: approved

---

## 1. Scope

Defines all contracts for `apps/backend/` implementation: file structure, TypeORM entities, REST API, WebSocket gateways, business logic invariants, and environment variables. Additive change — does not alter files outside `apps/backend/` except where noted.

---

## 2. Module and file structure

```
apps/backend/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.service.ts
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── roles.guard.ts
├── vehicles/
│   ├── vehicles.module.ts
│   ├── vehicles.controller.ts
│   ├── vehicles.service.ts
│   └── entities/vehicle.entity.ts
├── telemetry/
│   ├── telemetry.module.ts
│   ├── telemetry.controller.ts
│   ├── telemetry.service.ts
│   ├── telemetry.gateway.ts
│   └── entities/telemetry.entity.ts
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.controller.ts
│   ├── alerts.service.ts
│   ├── alerts.gateway.ts
│   └── entities/alert.entity.ts
├── simulation/
│   ├── simulation.module.ts
│   ├── simulation.service.ts
│   └── cities.config.ts
└── app.module.ts
```

---

## 2.1 Required npm dependencies

| Package | Purpose |
|---|---|
| `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` | NestJS core |
| `@nestjs/websockets`, `@nestjs/platform-socket.io` | WebSocket support |
| `@nestjs/typeorm` | TypeORM integration |
| `@nestjs/config` | Environment config |
| `typeorm` | ORM |
| `pg` | PostgreSQL driver |
| `bcrypt` | Password hashing |
| `class-validator`, `class-transformer` | DTO validation |
| `socket.io` | WS transport |

No `@nestjs/jwt` or `jsonwebtoken` package is permitted — JWT MUST be implemented manually using Node.js built-in `crypto` module.

---

## 3. Environment variables

Application MUST fail to start if any `DB_*` or `JWT_SECRET` is absent.

| Variable | Type | Default |
|---|---|---|
| `DB_HOST` | string | `localhost` |
| `DB_PORT` | number | `5432` |
| `DB_USER` | string | — |
| `DB_PASSWORD` | string | — |
| `DB_NAME` | string | — |
| `JWT_SECRET` | string | — |
| `JWT_EXPIRES_IN` | number | `86400` |
| `SIMULATE` | boolean string | — |
| `SIMULATE_INTERVAL_MS` | number | `3000` |
| `PORT` | number | `3001` |
| `NODE_ENV` | string | `development` |

---

## 4. Database entities

### 4.1 `users` → class `User`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `email` | varchar | UNIQUE, NOT NULL |
| `password_hash` | varchar | NOT NULL, `select: false` |
| `role` | enum `('admin','user')` | DEFAULT `'user'` |
| `created_at` | timestamp | DEFAULT NOW() |

`password_hash` MUST carry `{ select: false }` — excluded from all default queries.

### 4.2 `vehicles` → class `Vehicle`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `device_id` | varchar | UNIQUE, NOT NULL |
| `name` | varchar | NOT NULL |
| `city` | enum `('medellin','bogota','cali','barranquilla','cartagena','bucaramanga')` | NOT NULL |
| `status` | enum `('active','inactive')` | DEFAULT `'active'` |
| `created_at` | timestamp | DEFAULT NOW() |

### 4.3 `telemetry` → class `Telemetry`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `vehicle_id` | uuid | FK → vehicles.id |
| `lat` | decimal(10,7) | NOT NULL |
| `lng` | decimal(10,7) | NOT NULL |
| `speed` | decimal(5,2) | nullable |
| `fuel_level` | decimal(5,2) | nullable |
| `temperature` | decimal(5,2) | nullable |
| `timestamp` | timestamp | NOT NULL |

ManyToOne: `Telemetry.vehicle → Vehicle`.

### 4.4 `alerts` → class `Alert`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK |
| `vehicle_id` | uuid | FK → vehicles.id |
| `type` | enum `('low_fuel','high_temperature','speeding','offline')` | NOT NULL |
| `message` | varchar | NOT NULL |
| `resolved` | boolean | DEFAULT false |
| `created_at` | timestamp | DEFAULT NOW() |
| `resolved_at` | timestamp | nullable |

ManyToOne: `Alert.vehicle → Vehicle`.

---

## 5. Authentication

### 5.1 JWT implementation (`jwt.service.ts`)

Node.js `crypto` only. No third-party JWT library.

Format: `<header_b64url>.<payload_b64url>.<signature_b64url>`

- Header: `{"alg":"HS256","typ":"JWT"}` Base64url-encoded
- Payload: `{"sub":<userId>,"email":<email>,"role":<role>,"iat":<unix_s>,"exp":<unix_s + JWT_EXPIRES_IN>}`
- Signature: `crypto.createHmac('sha256', JWT_SECRET).update(header+'.'+payload).digest('base64url')`

| Method | Returns |
|---|---|
| `sign(payload: object): string` | Signed JWT |
| `verify(token: string): object \| null` | Decoded payload or null if invalid/expired |

### 5.2 Guards

**`JwtAuthGuard`:** Extracts Bearer from `Authorization`, calls `verify()`, attaches payload to `request.user`. Returns 401 if absent/invalid/expired.

**`RolesGuard`:** Reads `request.user.role`. Returns 403 if role doesn't match `@Roles()` decorator.

### 5.3 Passwords

Hashed with `bcrypt`, cost factor `10`. Never stored or logged raw.

---

## 6. REST API contracts

`ValidationPipe` global with `{ whitelist: true, forbidNonWhitelisted: true }`.

### 6.1 Auth

| Method | Path | Auth | Body | 2xx |
|---|---|---|---|---|
| POST | `/auth/register` | — | `email`, `password` (min 6), `role?` | 201: `{id,email,role}` |
| POST | `/auth/login` | — | `email`, `password` | 200: `{access_token,expires_in,user:{id,email,role}}` |
| GET | `/auth/me` | any | — | 200: `{id,email,role}` |

Errors: register 400 (duplicate email), login 401 (invalid credentials).

### 6.2 Vehicles

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/vehicles` | any | `device_id` masked per role |
| GET | `/vehicles/:id` | any | + `latest_telemetry` or null; 404 if missing |
| POST | `/vehicles` | admin | Body: `{name,city}`. Auto-generates `device_id`. 201 returns unmasked ID |
| PUT | `/vehicles/:id` | admin | Body: `{name?,city?,status?}` |
| DELETE | `/vehicles/:id` | admin | Cascades telemetry+alerts. 204 |

### 6.3 Telemetry

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/telemetry` | any | Body: `{vehicle_id,lat,lng,speed?,fuel_level?,temperature?}`. Timestamp server-side |
| GET | `/telemetry/:vehicleId` | any | Query: `page,limit,from,to`. Returns `{data,total,page,limit}` ordered DESC |
| GET | `/telemetry/:vehicleId/latest` | any | Single row or 404 |

POST 201: `{id,vehicle_id,lat,lng,speed,fuel_level,temperature,timestamp,alert_generated}`.

### 6.4 Alerts

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/alerts` | admin | Query: `resolved?,type?` (AND filter). Returns `vehicle_name` joined |
| GET | `/alerts/:vehicleId` | admin | Array for that vehicle |
| PATCH | `/alerts/:id/resolve` | admin | Sets `resolved=true, resolved_at=NOW()`. 400 if already resolved |

---

## 7. WebSocket gateways

### 7.1 `/telemetry` — `TelemetryGateway`

- JWT in socket handshake `auth.token`. Reject unauthenticated.
- Emits `vehicle:location` to ALL connected clients on every ingestion.
- `deviceId` in payload masked for `user`-role sockets, full for `admin`.

```json
{
  "vehicleId": "uuid",
  "deviceId": "DEV-****-XC54",
  "lat": 6.2451,
  "lng": -75.5820,
  "speed": 67.2,
  "fuel_level": 44.8,
  "temperature": 91.0,
  "timestamp": "2026-05-20T..."
}
```

### 7.2 `/alerts` — `AlertsGateway`

- Only `admin`-role JWT accepted; user-role connections rejected with `WsException`.
- Emits `alert:created` to all connected sockets when new alert created.

```json
{
  "alertId": "uuid",
  "vehicleId": "uuid",
  "vehicleName": "Camión 01",
  "type": "low_fuel",
  "message": "Combustible bajo: autonomía estimada de 45 minutos",
  "created_at": "2026-05-20T..."
}
```

---

## 8. Business logic invariants

### 8.1 `device_id` masking

Format: `DEV-XXXX-XXXX`. Middle segment masked for users.
- Admin: `DEV-A1B2-XC54`
- User: `DEV-****-XC54`

Single helper function `maskDeviceId(id: string, role: 'admin' | 'user'): string` used everywhere. Exception: `POST /vehicles` response always returns full ID.

### 8.2 Predictive fuel autonomy

On every telemetry ingestion:

1. Fetch N ≥ 5 most recent telemetry rows for vehicle (DESC)
2. `consumption_per_hour` = average rate of `fuel_level` decrease across consecutive pairs (%/hour)
3. If `consumption_per_hour <= 0`: skip, `alert_generated = false`
4. `autonomy_hours = current_fuel_level / consumption_per_hour`
5. If `autonomy_hours < 1`:
   - Query DB for existing unresolved `low_fuel` alert for this vehicle
   - If none: create Alert, emit `alert:created`, return `alert_generated = true`
   - If exists: skip, `alert_generated = false`

Duplicate prevention via DB query only (not in-memory — not restart-safe).

### 8.3 Simulation service

Active when `SIMULATE=true`.

- `onModuleInit`: fetch all `status='active'` vehicles, start `setInterval` per vehicle
- Each tick calls telemetry service internal ingestion (same path as REST POST)
- Tick values:
  - `lat/lng`: previous ± random `[-0.001, +0.001]` from `CITIES[vehicle.city]`
  - `fuel_level`: `max(0, previous - 0.1)`
  - `temperature`: random `[75.0, 95.0]`
  - `speed`: random `[20.0, 120.0]`
- New vehicle created → interval registered immediately
- Vehicle set to `inactive` → interval cleared

### 8.4 City coordinates (`cities.config.ts`)

```typescript
export const CITIES = {
  medellin:     { lat: 6.2442,   lng: -75.5812 },
  bogota:       { lat: 4.7110,   lng: -74.0721 },
  cali:         { lat: 3.4516,   lng: -76.5320 },
  barranquilla: { lat: 10.9685,  lng: -74.7813 },
  cartagena:    { lat: 10.3910,  lng: -75.4794 },
  bucaramanga:  { lat: 7.1193,   lng: -73.1227 },
} as const;
```

---

## 9. Authorization summary

| Method | Endpoint | JWT | Role |
|---|---|---|---|
| POST | `/auth/register` | No | — |
| POST | `/auth/login` | No | — |
| GET | `/auth/me` | Yes | any |
| GET | `/vehicles` | Yes | any |
| GET | `/vehicles/:id` | Yes | any |
| POST | `/vehicles` | Yes | admin |
| PUT | `/vehicles/:id` | Yes | admin |
| DELETE | `/vehicles/:id` | Yes | admin |
| POST | `/telemetry` | Yes | any |
| GET | `/telemetry/:vehicleId` | Yes | any |
| GET | `/telemetry/:vehicleId/latest` | Yes | any |
| GET | `/alerts` | Yes | admin |
| GET | `/alerts/:vehicleId` | Yes | admin |
| PATCH | `/alerts/:id/resolve` | Yes | admin |

| WS Namespace | Event | Connects | Receives |
|---|---|---|---|
| `/telemetry` | `vehicle:location` | any authenticated | all connected |
| `/alerts` | `alert:created` | admin only | all connected |

---

## 10. Security rules

1. `ValidationPipe` global: `whitelist: true`, `forbidNonWhitelisted: true`
2. `password_hash` never in any response body (`select: false`)
3. CORS enabled; `origin: '*'` acceptable in development
4. `synchronize: true` only when `NODE_ENV=development`

---

## 11. Acceptance scenarios

### S-1: Register and login
```
POST /auth/register { email: "a@b.com", password: "secret1", role: "user" }
→ 201, { id, email: "a@b.com", role: "user" }, no password_hash field

POST /auth/login { email: "a@b.com", password: "secret1" }
→ 200, access_token is 3-segment dot-separated string
→ expires_in === JWT_EXPIRES_IN, user.role === "user"
```

### S-2: Duplicate email
```
POST /auth/register with existing email → 400
```

### S-3: Wrong password
```
POST /auth/login { password: "wrong" } → 401
```

### S-4: JWT guard
```
GET /auth/me (no token) → 401
GET /auth/me (expired/tampered) → 401
GET /auth/me (valid) → 200, { id, email, role }
```

### S-5: Role guard
```
POST /vehicles (user JWT) → 403
GET /alerts (user JWT) → 403
```

### S-6: device_id masking
```
Vehicle device_id = "DEV-A1B2-XC54"
GET /vehicles (admin JWT) → device_id === "DEV-A1B2-XC54"
GET /vehicles (user JWT)  → device_id === "DEV-****-XC54"
```

### S-7: Auto-generate device_id
```
POST /vehicles { name: "Camión 01", city: "medellin" } (admin)
→ 201, device_id matches /^DEV-[A-Z0-9]{4}-[A-Z0-9]{4}$/ (unmasked, unique)
```

### S-8: Simulation starts on vehicle create
```
SIMULATE=true, SIMULATE_INTERVAL_MS=3000
POST /vehicles → 201
Within 3500ms → telemetry row exists for that vehicle_id
```

### S-9: Delete cascades
```
Vehicle V has 10 telemetry + 2 alert rows
DELETE /vehicles/V → 204
COUNT telemetry WHERE vehicle_id=V → 0
COUNT alerts WHERE vehicle_id=V → 0
```

### S-10: Telemetry ingestion
```
POST /telemetry { vehicle_id: V, lat, lng, speed, fuel_level: 80, temperature }
→ 201, alert_generated: false
→ row in DB, vehicle:location emitted on /telemetry WS
```

### S-11: Low fuel alert created
```
V has 5+ records with consistent fuel decrease, autonomy_hours < 1, no active alert
POST /telemetry for V → 201, alert_generated: true
→ Alert row type="low_fuel", resolved=false
→ alert:created emitted on /alerts WS
```

### S-12: No duplicate alerts
```
Unresolved low_fuel alert exists for V
Next POST /telemetry with autonomy_hours < 1 → alert_generated: false
No new Alert row created
```

### S-13: Resolve alert
```
PATCH /alerts/X/resolve → 200, { id, resolved: true, resolved_at: <ts> }
PATCH /alerts/X/resolve (again) → 400
```

### S-14: Pagination
```
V has 120 telemetry records
GET /telemetry/V?page=1&limit=50 → data.length=50, total=120
GET /telemetry/V?page=3&limit=50 → data.length=20
```

### S-15: Date range filter
```
GET /telemetry/V?from=2026-05-10T00:00:00Z&to=2026-05-15T23:59:59Z
→ all records within [2026-05-10, 2026-05-15]
```

### S-16: WS auth enforcement
```
/telemetry connect (no token) → disconnected
/alerts connect (user JWT) → disconnected with auth error
```

### S-17: Simulation realistic values
```
SIMULATE=true, V in "medellin"
Two ticks: each produces row, fuel decreases 0.1/tick, temp in [75,95], speed in [20,120]
```

### S-18: Alert filtering
```
GET /alerts?resolved=false → only unresolved
GET /alerts?type=low_fuel → only low_fuel
GET /alerts?resolved=false&type=low_fuel → AND filter
```

---

## 12. Out of scope

- Swagger/OpenAPI
- Rate limiting
- Database migrations (synchronize: true for dev)
- Production TLS
- Refresh tokens / revocation
- `high_temperature`, `speeding`, `offline` alert evaluation (enum exists, logic deferred)
- Admin UI

---

## 13. Constraints (non-negotiable)

1. No `@nestjs/jwt` — manual crypto JWT required
2. `synchronize: true` only in development
3. `password_hash` never exposed — `select: false` + no manual inclusion
4. `maskDeviceId()` single helper — called in every code path
5. Duplicate-alert prevention via DB query (not in-memory)
6. Simulation calls service method (not repo directly) — all side-effects fire
7. `nest-cli.json` must NOT have `"monorepo": true`
8. No `paths` aliases in tsconfig (SWC builder constraint)
