# Simon Movilidad — Frontend (apps/web)

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 + TypeScript |
| Router | App Router |
| Estilos | Tailwind CSS 4 |
| Componentes base | shadcn/ui |
| Mapa | MapLibre GL JS (open source, sin API key) |
| Gráficos | Recharts |
| WebSockets | socket.io-client |
| Estado global | Zustand |
| HTTP | axios + interceptor JWT |
| Offline | IndexedDB con `idb` + Service Worker |
| Componentes | Atomic Design (atoms/molecules/organisms/templates) |

---

## Páginas y Funcionalidades

### `/login` — Pública
- Formulario de autenticación (email + password)
- Al autenticar guarda JWT y datos del usuario en el store de auth
- Redirige a `/dashboard` si ya está autenticado

### `/dashboard` — Protegida (any)
- Mapa MapLibre con un marker por vehículo activo
- Los markers se mueven en tiempo real via WebSocket (`vehicle:location`)
- Panel lateral con lista de vehículos: nombre, fuel, temperatura, velocidad actual
- Badge rojo en vehículos con autonomía de combustible < 1 hora
- **Solo admin:** toast de notificación en tiempo real cuando llega `alert:created`
- **Solo admin:** banner/badge en navbar con conteo de alertas sin resolver

### `/vehicles` — Protegida (any)
- Tabla de todos los vehículos con estado actual
- `device_id` enmascarado para usuarios no-admin (`DEV-****-XC54`)
- **Solo admin:** botón crear vehículo (modal con nombre + selector de ciudad)
- **Solo admin:** acciones de editar y desactivar por vehículo

### `/vehicles/:id` — Protegida (any)
- Header con datos del vehículo (nombre, ciudad, estado, device_id según rol)
- Tarjetas de métricas en tiempo real: velocidad, combustible, temperatura, posición
- Gráfico histórico de velocidad (Recharts, línea temporal)
- Gráfico histórico de combustible (Recharts, área con zona de alerta roja < 20%)
- Mini mapa con la posición actual del vehículo
- **Solo admin:** timeline de alertas del vehículo con opción de resolver

### `/alerts` — Protegida (solo admin)
- Lista de alertas activas ordenadas por fecha descendente
- Filtros por tipo (`low_fuel`, `high_temperature`, `speeding`, `offline`) y estado
- Cada alerta muestra: vehículo, tipo, mensaje, tiempo transcurrido
- Botón para resolver alerta individualmente
- Nuevas alertas aparecen en tiempo real via WebSocket sin recargar

---

## Lógica de Roles en UI

| Funcionalidad | Admin | User |
|---------------|-------|------|
| Ver `device_id` completo | ✅ | ❌ (enmascarado) |
| CRUD vehículos | ✅ | ❌ |
| Ver página `/alerts` | ✅ | ❌ |
| Recibir toasts de alertas | ✅ | ❌ |
| Badge de alertas en navbar | ✅ | ❌ |
| Ver timeline de alertas en `/vehicles/:id` | ✅ | ❌ |
| Ver dashboard y telemetría | ✅ | ✅ |
| Ver historial de gráficos | ✅ | ✅ |

---

## Estrategia Offline

### Qué se cachea en IndexedDB
- Últimas posiciones de todos los vehículos (`telemetry` store)
- Alertas activas (`alerts` store)
- Lista de vehículos (`vehicles` store)

### Flujo online → offline
1. `use-connectivity` detecta evento `offline` del browser
2. Actualiza `connectivity.store` a `offline`
3. Los hooks (`use-vehicles`, `use-alerts`) dejan de llamar a la API
4. UI lee desde IndexedDB y muestra banner "Modo offline — datos en caché"
5. WebSocket intenta reconexión automática en background

### Flujo offline → online
1. `use-connectivity` detecta evento `online`
2. `use-offline-sync` sincroniza: hace fetch fresco de vehículos, telemetría y alertas
3. Actualiza IndexedDB con datos frescos
4. UI vuelve a estado normal, banner desaparece

---

## Arquitectura de Carpetas

```
apps/web/
├── src/
│   ├── app/                          ← App Router Next.js
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/              ← rutas protegidas
│   │   │   ├── layout.tsx            ← verifica JWT, redirige si no auth
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── vehicles/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── alerts/
│   │   │       └── page.tsx
│   │   └── layout.tsx                ← root layout
│   │
│   ├── components/                   ← Atomic Design
│   │   ├── atoms/
│   │   ├── molecules/
│   │   ├── organisms/
│   │   └── templates/
│   │
│   ├── lib/                          ← utilidades puras, sin estado
│   │   ├── api/
│   │   │   ├── client.ts             ← axios instance + interceptor JWT
│   │   │   ├── auth.api.ts
│   │   │   ├── vehicles.api.ts
│   │   │   ├── telemetry.api.ts
│   │   │   └── alerts.api.ts
│   │   ├── socket/
│   │   │   ├── socket.client.ts      ← instancia socket.io-client singleton
│   │   │   ├── telemetry.socket.ts   ← suscripción a vehicle:location
│   │   │   └── alerts.socket.ts      ← suscripción a alert:created
│   │   ├── db/
│   │   │   ├── idb.client.ts         ← setup IndexedDB con idb
│   │   │   ├── telemetry.store.ts    ← CRUD offline telemetría
│   │   │   ├── alerts.store.ts       ← CRUD offline alertas
│   │   │   └── vehicles.store.ts     ← CRUD offline vehículos
│   │   ├── map/
│   │   │   ├── maplibre.config.ts    ← inicialización del mapa
│   │   │   └── markers.ts            ← lógica de markers por vehículo
│   │   └── utils/
│   │       ├── mask-device-id.ts     ← DEV-A1B2-XC54 → DEV-****-XC54
│   │       ├── fuel-autonomy.ts      ← calcula horas restantes de combustible
│   │       ├── format-date.ts        ← fechas consistentes en toda la app
│   │       └── cn.ts                 ← classnames helper (shadcn standard)
│   │
│   ├── stores/                       ← Zustand
│   │   ├── auth.store.ts             ← user, token, rol
│   │   ├── vehicles.store.ts         ← lista de vehículos + posiciones live
│   │   ├── alerts.store.ts           ← alertas activas + contador sin resolver
│   │   └── connectivity.store.ts     ← online/offline status
│   │
│   ├── hooks/
│   │   ├── use-vehicles.ts           ← fetch + suscripción WS combinados
│   │   ├── use-alerts.ts             ← fetch + suscripción WS combinados
│   │   ├── use-telemetry-history.ts  ← historial para los gráficos
│   │   ├── use-map.ts                ← inicializa mapa + maneja markers
│   │   ├── use-connectivity.ts       ← detecta online/offline
│   │   └── use-offline-sync.ts       ← sincroniza IndexedDB cuando vuelve online
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── vehicle.types.ts
│   │   ├── telemetry.types.ts
│   │   └── alert.types.ts
│   │
│   └── middleware.ts                 ← Next.js middleware, protege rutas
```

---

## Tipos Principales

```typescript
// vehicle.types.ts
export type City =
  | 'medellin'
  | 'bogota'
  | 'cali'
  | 'barranquilla'
  | 'cartagena'
  | 'bucaramanga'

export type VehicleStatus = 'active' | 'inactive'

export interface Vehicle {
  id: string
  device_id: string        // enmascarado o completo según rol
  name: string
  city: City
  status: VehicleStatus
  created_at: string
  latest_telemetry?: Telemetry
}

// telemetry.types.ts
export interface Telemetry {
  id?: string
  vehicle_id: string
  lat: number
  lng: number
  speed: number
  fuel_level: number
  temperature: number
  timestamp: string
}

// alert.types.ts
export type AlertType = 'low_fuel' | 'high_temperature' | 'speeding' | 'offline'

export interface Alert {
  id: string
  vehicle_id: string
  vehicle_name: string
  type: AlertType
  message: string
  resolved: boolean
  created_at: string
  resolved_at?: string
}

// auth.types.ts
export type Role = 'admin' | 'user'

export interface User {
  id: string
  email: string
  role: Role
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}
```

---

## Utils — Detalle de Implementación

### `mask-device-id.ts`
```typescript
// Recibe el device_id completo y el rol del usuario
// Admin → DEV-A1B2-XC54 (sin cambios)
// User  → DEV-****-XC54
export function maskDeviceId(deviceId: string, role: Role): string
```

### `fuel-autonomy.ts`
```typescript
// Dado el fuel_level actual y array de lecturas recientes,
// calcula las horas de autonomía restantes
// Retorna null si no hay suficientes datos para calcular
export function calculateFuelAutonomy(
  currentFuel: number,
  recentReadings: Telemetry[]
): number | null

// Retorna true si la autonomía es menor a 1 hora
export function isFuelCritical(autonomyHours: number | null): boolean
```

### `socket.client.ts`
```typescript
// Singleton — una sola conexión reutilizada por todos los hooks
// Se conecta con el JWT del auth.store automáticamente
export function getSocket(namespace: '/telemetry' | '/alerts'): Socket
```

### `idb.client.ts`
```typescript
// Abre la BD IndexedDB 'simon-movilidad' con los stores:
// - telemetry (keyPath: 'id', index: vehicle_id)
// - alerts    (keyPath: 'id', index: vehicle_id)
// - vehicles  (keyPath: 'id')
export function openDB(): Promise<IDBPDatabase>
```

---

## Variables de Entorno

```env
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## Resumen de Rutas

| Ruta | Auth | Rol | Descripción |
|------|------|-----|-------------|
| `/login` | No | — | Formulario de login |
| `/dashboard` | Sí | any | Mapa en tiempo real |
| `/vehicles` | Sí | any | Lista de vehículos |
| `/vehicles/:id` | Sí | any | Detalle + gráficos |
| `/alerts` | Sí | admin | Gestión de alertas |