# Simon Movilidad — Backend API

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS + TypeScript |
| Base de datos | PostgreSQL 16 (Docker) |
| ORM | TypeORM |
| Auth | JWT manual con `crypto` nativo de Node.js |
| Tiempo real | WebSockets con `@nestjs/websockets` + `socket.io` |
| Hashing | `bcrypt` |
| Validación | `class-validator` + `class-transformer` |
| Config | `@nestjs/config` |
| Driver BD | `pg` |

---

## Docker Compose (PostgreSQL)

```yaml
# docker-compose.yml (raíz del monorepo)
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: simon_movilidad_db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Variables de Entorno

```env
# apps/backend/.env

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=simon
DB_PASSWORD=simon123
DB_NAME=simon_movilidad

# JWT (implementación manual con crypto)
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=86400        # segundos (24h)

# Simulación
SIMULATE=true
SIMULATE_INTERVAL_MS=3000   # cada cuánto se actualiza la posición

# App
PORT=3001
NODE_ENV=development
```

---

## Modelos de Base de Datos

```typescript
// users
id           UUID PK
email        VARCHAR UNIQUE NOT NULL
password_hash VARCHAR NOT NULL
role         ENUM('admin', 'user') DEFAULT 'user'
created_at   TIMESTAMP DEFAULT NOW()

// vehicles
id           UUID PK
device_id    VARCHAR UNIQUE NOT NULL   -- ej: DEV-A1B2-XC54
name         VARCHAR NOT NULL
city         ENUM('medellin','bogota','cali','barranquilla','cartagena','bucaramanga')
status       ENUM('active','inactive') DEFAULT 'active'
created_at   TIMESTAMP DEFAULT NOW()

// telemetry
id           UUID PK
vehicle_id   UUID FK → vehicles.id
lat          DECIMAL(10,7) NOT NULL
lng          DECIMAL(10,7) NOT NULL
speed        DECIMAL(5,2)            -- km/h
fuel_level   DECIMAL(5,2)            -- porcentaje 0-100
temperature  DECIMAL(5,2)            -- °C (motor)
timestamp    TIMESTAMP NOT NULL

// alerts
id           UUID PK
vehicle_id   UUID FK → vehicles.id
type         ENUM('low_fuel','high_temperature','speeding','offline')
message      VARCHAR NOT NULL
resolved     BOOLEAN DEFAULT false
created_at   TIMESTAMP DEFAULT NOW()
resolved_at  TIMESTAMP NULL
```

---

## Ciudades y Coordenadas

```typescript
const CITIES = {
  medellin:     { lat: 6.2442,   lng: -75.5812 },
  bogota:       { lat: 4.7110,   lng: -74.0721 },
  cali:         { lat: 3.4516,   lng: -76.5320 },
  barranquilla: { lat: 10.9685,  lng: -74.7813 },
  cartagena:    { lat: 10.3910,  lng: -75.4794 },
  bucaramanga:  { lat: 7.1193,   lng: -73.1227 },
}
```

---

## Lógica de Negocio

### Enmascaramiento de device_id
- **Admin:** ve el ID completo → `DEV-A1B2-XC54`
- **User:** ve el ID enmascarado → `DEV-****-XC54`
- Se aplica en cualquier endpoint que retorne vehículos

### Cálculo predictivo de combustible
```
consumo_por_hora = promedio de caída de fuel_level en las últimas N lecturas
autonomia_horas  = fuel_level_actual / consumo_por_hora

Si autonomia_horas < 1 → generar alerta tipo 'low_fuel'
```
- Se evalúa en cada ingesta de telemetría
- Si ya existe una alerta `low_fuel` activa para ese vehículo, no se duplica

### Simulación (SIMULATE=true)
- Al arrancar el backend, el `SimulationService` lanza un "conductor virtual" por cada vehículo con `status=active`
- Cada `SIMULATE_INTERVAL_MS` ms genera una nueva lectura de telemetría con:
  - Movimiento realista (variación ±0.001 en lat/lng desde el centro de la ciudad)
  - Combustible bajando gradualmente (−0.1% por tick)
  - Temperatura fluctuando entre 75°C y 95°C
  - Velocidad variable entre 20 y 120 km/h
- Internamente ejecuta la misma lógica que `POST /telemetry` (guarda en BD + emite WebSocket + evalúa alertas)
- Cuando se crea un vehículo nuevo con `SIMULATE=true`, el simulador lo agrega automáticamente

---

## Endpoints REST

### Auth

#### `POST /auth/register`
Registra un nuevo usuario.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "user"
}
```
**Response 201:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "user"
}
```
**Errores:** `400` email ya registrado.

---

#### `POST /auth/login`
Autentica usuario y retorna JWT generado manualmente con `crypto`.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response 200:**
```json
{
  "access_token": "header.payload.signature",
  "expires_in": 86400,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```
**Errores:** `401` credenciales inválidas.

---

#### `GET /auth/me`
Retorna el usuario autenticado. Requiere JWT.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "admin"
}
```

---

### Vehicles

#### `GET /vehicles`
Lista todos los vehículos. El `device_id` se enmascara según el rol del usuario autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "device_id": "DEV-****-XC54",   // user normal
    "name": "Camión 01",
    "city": "medellin",
    "status": "active",
    "created_at": "2026-05-20T..."
  }
]
```

---

#### `GET /vehicles/:id`
Detalle de un vehículo con su última telemetría.

**Response 200:**
```json
{
  "id": "uuid",
  "device_id": "DEV-****-XC54",
  "name": "Camión 01",
  "city": "medellin",
  "status": "active",
  "latest_telemetry": {
    "lat": 6.2451,
    "lng": -75.5820,
    "speed": 65.3,
    "fuel_level": 72.4,
    "temperature": 88.1,
    "timestamp": "2026-05-20T..."
  }
}
```

---

#### `POST /vehicles`
Crea un nuevo vehículo. Solo admin. Genera `device_id` automáticamente.

**Headers:** `Authorization: Bearer <token>` (role: admin)

**Body:**
```json
{
  "name": "Camión 01",
  "city": "medellin"
}
```
**Response 201:**
```json
{
  "id": "uuid",
  "device_id": "DEV-A1B2-XC54",
  "name": "Camión 01",
  "city": "medellin",
  "status": "active"
}
```
**Nota:** Si `SIMULATE=true`, el simulador arranca automáticamente para este vehículo.

---

#### `PUT /vehicles/:id`
Actualiza nombre, ciudad o status de un vehículo. Solo admin.

**Body:**
```json
{
  "name": "Camión 01 - Actualizado",
  "status": "inactive"
}
```
**Response 200:** vehículo actualizado.

---

#### `DELETE /vehicles/:id`
Elimina un vehículo y su historial de telemetría. Solo admin.

**Response 204:** sin contenido.

---

### Telemetría

#### `POST /telemetry`
Ingesta de datos desde un dispositivo real (usado cuando `SIMULATE=false`).

**Body:**
```json
{
  "vehicle_id": "uuid",
  "lat": 6.2442,
  "lng": -75.5812,
  "speed": 65.0,
  "fuel_level": 45.2,
  "temperature": 90.1
}
```
**Response 201:**
```json
{
  "id": "uuid",
  "vehicle_id": "uuid",
  "lat": 6.2442,
  "lng": -75.5812,
  "speed": 65.0,
  "fuel_level": 45.2,
  "temperature": 90.1,
  "timestamp": "2026-05-20T...",
  "alert_generated": false
}
```
**Lógica interna:**
1. Guarda en BD
2. Evalúa autonomía de combustible
3. Si `autonomia < 1h` → crea alerta y emite por WebSocket
4. Emite evento `vehicle:location` por WebSocket

---

#### `GET /telemetry/:vehicleId`
Historial de telemetría de un vehículo con paginación.

**Query params:** `?page=1&limit=50&from=ISO_DATE&to=ISO_DATE`

**Response 200:**
```json
{
  "data": [
    {
      "lat": 6.2442,
      "lng": -75.5812,
      "speed": 65.0,
      "fuel_level": 45.2,
      "temperature": 90.1,
      "timestamp": "2026-05-20T..."
    }
  ],
  "total": 250,
  "page": 1,
  "limit": 50
}
```

---

#### `GET /telemetry/:vehicleId/latest`
Última lectura de telemetría de un vehículo.

**Response 200:** objeto telemetría simple.

---

### Alertas

#### `GET /alerts`
Lista todas las alertas activas. Solo admin.

**Query params:** `?resolved=false&type=low_fuel`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "vehicle_id": "uuid",
    "vehicle_name": "Camión 01",
    "type": "low_fuel",
    "message": "Combustible bajo: autonomía estimada de 45 minutos",
    "resolved": false,
    "created_at": "2026-05-20T..."
  }
]
```

---

#### `GET /alerts/:vehicleId`
Alertas de un vehículo específico. Solo admin.

**Response 200:** array de alertas del vehículo.

---

#### `PATCH /alerts/:id/resolve`
Marca una alerta como resuelta. Solo admin.

**Response 200:**
```json
{
  "id": "uuid",
  "resolved": true,
  "resolved_at": "2026-05-20T..."
}
```

---

## WebSockets

**Namespace:** `/telemetry`
**Namespace:** `/alerts`

### Evento: `vehicle:location`
Emitido en `/telemetry` cada vez que llega una nueva lectura (por ingesta real o simulación).

```json
{
  "event": "vehicle:location",
  "data": {
    "vehicleId": "uuid",
    "deviceId": "DEV-****-XC54",
    "lat": 6.2451,
    "lng": -75.5820,
    "speed": 67.2,
    "fuel_level": 44.8,
    "temperature": 91.0,
    "timestamp": "2026-05-20T..."
  }
}
```

### Evento: `alert:created`
Emitido en `/alerts` cuando se genera una nueva alerta predictiva.

```json
{
  "event": "alert:created",
  "data": {
    "alertId": "uuid",
    "vehicleId": "uuid",
    "vehicleName": "Camión 01",
    "type": "low_fuel",
    "message": "Combustible bajo: autonomía estimada de 45 minutos",
    "created_at": "2026-05-20T..."
  }
}
```
**Nota:** solo se emite a clientes con rol `admin`.

---

## Estructura de Módulos NestJS

```
apps/backend/src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.service.ts          ← implementación manual con crypto
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
│   ├── telemetry.gateway.ts    ← WebSocket gateway
│   └── entities/telemetry.entity.ts
├── alerts/
│   ├── alerts.module.ts
│   ├── alerts.controller.ts
│   ├── alerts.service.ts
│   ├── alerts.gateway.ts       ← WebSocket gateway
│   └── entities/alert.entity.ts
├── simulation/
│   ├── simulation.module.ts
│   ├── simulation.service.ts   ← SIMULATE=true logic
│   └── cities.config.ts        ← coordenadas de ciudades
└── app.module.ts
```

---

## Resumen de Endpoints

| Método | Endpoint | Auth | Rol |
|--------|----------|------|-----|
| POST | `/auth/register` | No | — |
| POST | `/auth/login` | No | — |
| GET | `/auth/me` | Sí | any |
| GET | `/vehicles` | Sí | any |
| GET | `/vehicles/:id` | Sí | any |
| POST | `/vehicles` | Sí | admin |
| PUT | `/vehicles/:id` | Sí | admin |
| DELETE | `/vehicles/:id` | Sí | admin |
| POST | `/telemetry` | Sí | any |
| GET | `/telemetry/:vehicleId` | Sí | any |
| GET | `/telemetry/:vehicleId/latest` | Sí | any |
| GET | `/alerts` | Sí | admin |
| GET | `/alerts/:vehicleId` | Sí | admin |
| PATCH | `/alerts/:id/resolve` | Sí | admin |

| Canal WS | Evento | Receptor |
|----------|--------|----------|
| `/telemetry` | `vehicle:location` | any |
| `/alerts` | `alert:created` | admin |