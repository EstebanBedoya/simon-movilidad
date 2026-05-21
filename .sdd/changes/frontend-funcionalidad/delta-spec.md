# Delta Spec: Frontend Funcionalidad Completa

## Resumen

Implementar la capa funcional completa del frontend de simon-movilidad (apps/web): tipos alineados al backend, stores Zustand, API layer (axios), socket layer (socket.io-client), persistencia offline (IndexedDB/idb), hooks de datos, rutas con auth y middleware, y adaptación de los 25 componentes existentes para consumir datos reales en lugar de mocks.

## Prerrequisitos

### Dependencias a instalar en apps/web
- `zustand` — state management
- `axios` — cliente HTTP con interceptores
- `socket.io-client` — WebSockets
- `recharts` — gráficos de historial de telemetría
- `maplibre-gl` — mapa interactivo real (reemplaza SVG mock)
- `idb` — wrapper tipado para IndexedDB

### Variables de entorno requeridas
- `NEXT_PUBLIC_API_URL` — URL base del backend (e.g. `http://localhost:3001`)
- `NEXT_PUBLIC_WS_URL` — URL base para WebSockets (puede coincidir con API_URL)

### Restricciones de estructura
- NO existe carpeta `src/`. Todo vive directamente en `apps/web/`.
- Las nuevas carpetas van en el mismo nivel que `app/`, `components/`, `lib/`, `types/`.
- El archivo `lib/mock-data.ts` y `lib/fleet-utils.ts` permanecen pero dejan de ser la fuente de verdad en runtime.

---

## Módulo 1: Tipos y tipos derivados

### Objetivo
Reemplazar `types/fleet.ts` (tipos incompatibles con el backend) por un conjunto de archivos de tipos alineados al contrato real de la API, más un tipo derivado `UIVehicleStatus` que el frontend computa localmente.

### Archivos afectados
- `types/fleet.ts` — reescritura total (mantiene el path para no romper imports existentes mientras se migra)
- `types/auth.types.ts` — nuevo
- `types/vehicle.types.ts` — nuevo
- `types/telemetry.types.ts` — nuevo
- `types/alert.types.ts` — nuevo

### Requisitos

- [ ] RQ-1-01: `types/auth.types.ts` debe exportar `UserRole = "admin" | "operator"`, `AuthUser = { id: string; email: string; role: UserRole }`, y `AuthTokenPayload = { access_token: string; expires_in: number; user: AuthUser }`.
- [ ] RQ-1-02: `types/vehicle.types.ts` debe exportar `BackendVehicleStatus = "active" | "inactive"` como el tipo que proviene del backend, y `Vehicle = { id: string; plate: string; driver_name: string; status: BackendVehicleStatus; created_at: string; updated_at: string }`. El campo `latest_telemetry?: Telemetry` es opcional y solo aparece en `GET /vehicles/:id`.
- [ ] RQ-1-03: `types/telemetry.types.ts` debe exportar `Telemetry = { id: string; vehicle_id: string; lat: number; lng: number; speed: number; fuel_level: number; engine_temp: number; timestamp: string }` y `TelemetryPage = { data: Telemetry[]; total: number; page: number; limit: number }`.
- [ ] RQ-1-04: `types/alert.types.ts` debe exportar `AlertSeverity = "critical" | "warn" | "info"`, `Alert = { id: string; vehicle_id: string; severity: AlertSeverity; message: string; resolved: boolean; resolved_at: string | null; created_at: string }`.
- [ ] RQ-1-05: `types/fleet.ts` debe exportar `UIVehicleStatus = "active" | "idle" | "alert" | "offline"` como tipo derivado (no proviene del backend).
- [ ] RQ-1-06: `types/fleet.ts` debe exportar la función pura `deriveUiStatus(vehicle: Vehicle, vehicleAlerts: Alert[]): UIVehicleStatus` con las siguientes reglas de derivación, en orden de prioridad:
  1. Si `vehicle.status === "inactive"` → `"offline"`
  2. Si existe alguna alerta en `vehicleAlerts` con `resolved === false` → `"alert"`
  3. Si `vehicle.status === "active"` y la última telemetría conocida tiene `speed === 0` → `"idle"`
  4. Si `vehicle.status === "active"` y `speed > 0` → `"active"`
  5. Fallback → `"offline"`
- [ ] RQ-1-07: `types/fleet.ts` debe re-exportar los tipos `Vehicle`, `Telemetry`, `Alert`, `AuthUser`, `UserRole` desde sus respectivos archivos para que los componentes existentes puedan actualizar sus imports gradualmente.
- [ ] RQ-1-08: El campo `mask` y la función `maskId()` deben ser eliminados. El backend ya aplica masking server-side. Los componentes deben mostrar `vehicle.id` directamente.
- [ ] RQ-1-09: El campo `head` (heading) no existe en el backend. El frontend lo computa client-side desde dos posiciones consecutivas de telemetría usando la fórmula de rumbo geodésico. La función `computeHeading(prev: {lat,lng}, curr: {lat,lng}): number` debe exportarse desde `types/fleet.ts` o `lib/map/heading.ts`.

### Escenarios

**Escenario:** Derivar estado UI cuando vehículo tiene alerta no resuelta
- Dado: un `Vehicle` con `status: "active"` y un array de alertas que contiene una `Alert` con `resolved: false`
- Cuando: se llama `deriveUiStatus(vehicle, alerts)`
- Entonces: retorna `"alert"` (la alerta tiene prioridad sobre el movimiento)

**Escenario:** Derivar estado UI de vehículo activo en movimiento sin alertas
- Dado: un `Vehicle` con `status: "active"`, `latest_telemetry.speed = 55`, y un array de alertas vacío o con todas resueltas
- Cuando: se llama `deriveUiStatus(vehicle, alerts)`
- Entonces: retorna `"active"`

**Escenario:** Derivar estado UI de vehículo activo detenido sin alertas
- Dado: un `Vehicle` con `status: "active"`, `latest_telemetry.speed = 0`, y alertas vacías
- Cuando: se llama `deriveUiStatus(vehicle, alerts)`
- Entonces: retorna `"idle"`

**Escenario:** Derivar estado UI de vehículo inactivo
- Dado: un `Vehicle` con `status: "inactive"` (sin importar alertas ni telemetría)
- Cuando: se llama `deriveUiStatus(vehicle, alerts)`
- Entonces: retorna `"offline"`

---

## Módulo 2: Stores Zustand

### Objetivo
Crear cuatro stores Zustand que actúen como fuente de verdad reactiva para la UI, reemplazando el estado local de `app/page.tsx`.

### Archivos afectados
- `stores/auth.store.ts` — nuevo
- `stores/vehicles.store.ts` — nuevo
- `stores/alerts.store.ts` — nuevo
- `stores/connectivity.store.ts` — nuevo

### Requisitos

- [ ] RQ-2-01: `stores/auth.store.ts` debe exportar `useAuthStore` con el estado `{ user: AuthUser | null; token: string | null; isAuthenticated: boolean }` y las acciones `login(token: string, user: AuthUser): void` y `logout(): void`. Al llamar `logout()`, el token y el user se limpian y `isAuthenticated` pasa a `false`.
- [ ] RQ-2-02: El token en `auth.store` debe persistirse en `localStorage` usando el middleware `persist` de Zustand, con la clave `"simon_auth"`. Al inicializar la app, el store rehidrata desde `localStorage`.
- [ ] RQ-2-03: `stores/vehicles.store.ts` debe exportar `useVehiclesStore` con `{ vehicles: Vehicle[]; isLoading: boolean; error: string | null }` y las acciones `setVehicles(vehicles: Vehicle[]): void`, `updateVehiclePosition(vehicleId: string, telemetry: Telemetry): void`, y `setLoading(v: boolean): void`.
- [ ] RQ-2-04: `updateVehiclePosition` en el vehicles store debe actualizar inmutablemente el vehículo correspondiente aplicando el nuevo `latest_telemetry` sin hacer fetch adicional.
- [ ] RQ-2-05: `stores/alerts.store.ts` debe exportar `useAlertsStore` con `{ alerts: Alert[]; unresolvedCount: number }` y las acciones `setAlerts(alerts: Alert[]): void`, `addAlert(alert: Alert): void`, `resolveAlert(id: string, resolvedAt: string): void`. El campo `unresolvedCount` debe mantenerse derivado/sincronizado automáticamente en cada mutación.
- [ ] RQ-2-06: `stores/connectivity.store.ts` debe exportar `useConnectivityStore` con `{ isOnline: boolean; wsStatus: "LIVE" | "RECONNECTING" | "DISCONNECTED" }` y las acciones `setOnline(v: boolean): void` y `setWsStatus(s: "LIVE" | "RECONNECTING" | "DISCONNECTED"): void`.

### Escenarios

**Escenario:** Login exitoso persiste token
- Dado: el auth store está vacío
- Cuando: se llama `login("jwt.token.abc", { id: "1", email: "ops@simon.co", role: "operator" })`
- Entonces: `isAuthenticated` es `true`, `token` es `"jwt.token.abc"`, y `localStorage["simon_auth"]` contiene el token serializado

**Escenario:** Logout limpia estado
- Dado: el auth store tiene un usuario autenticado
- Cuando: se llama `logout()`
- Entonces: `isAuthenticated` es `false`, `user` es `null`, `token` es `null`

**Escenario:** Actualización de posición no reemplaza el array completo
- Dado: el vehicles store tiene 10 vehículos
- Cuando: se llama `updateVehiclePosition("v-id-5", nuevaTelemetria)`
- Entonces: solo el vehículo con `id === "v-id-5"` tiene su `latest_telemetry` actualizado; los otros 9 no cambian

**Escenario:** Conteo de alertas sin resolver se actualiza al agregar alerta
- Dado: el alerts store tiene `unresolvedCount = 2`
- Cuando: se llama `addAlert({ ..., resolved: false })`
- Entonces: `unresolvedCount` pasa a `3`

---

## Módulo 3: API Layer (axios)

### Objetivo
Crear una capa de acceso HTTP centralizada con interceptores JWT, cubriendo todos los endpoints del backend.

### Archivos afectados
- `lib/api/client.ts` — nuevo
- `lib/api/auth.api.ts` — nuevo
- `lib/api/vehicles.api.ts` — nuevo
- `lib/api/telemetry.api.ts` — nuevo
- `lib/api/alerts.api.ts` — nuevo

### Requisitos

- [ ] RQ-3-01: `lib/api/client.ts` debe crear y exportar una instancia axios con `baseURL = process.env.NEXT_PUBLIC_API_URL`. El interceptor de request debe leer `useAuthStore.getState().token` y, si existe, añadir el header `Authorization: Bearer <token>`. Este acceso debe hacerse fuera de componentes React (uso de `getState()`, no `useAuthStore()`).
- [ ] RQ-3-02: El interceptor de response del cliente axios debe interceptar respuestas `401` y llamar `useAuthStore.getState().logout()` seguido de una redirección a `/login`, para manejar tokens expirados automáticamente.
- [ ] RQ-3-03: `lib/api/auth.api.ts` debe exportar `login(email: string, password: string): Promise<AuthTokenPayload>` (POST `/auth/login`) y `me(): Promise<AuthUser>` (GET `/auth/me`).
- [ ] RQ-3-04: `lib/api/vehicles.api.ts` debe exportar:
  - `getVehicles(): Promise<Vehicle[]>` → GET `/vehicles`
  - `getVehicle(id: string): Promise<Vehicle & { latest_telemetry: Telemetry }>` → GET `/vehicles/:id`
  - `createVehicle(data: Omit<Vehicle, "id" | "created_at" | "updated_at">): Promise<Vehicle>` → POST `/vehicles`
  - `updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle>` → PUT `/vehicles/:id`
  - `deleteVehicle(id: string): Promise<void>` → DELETE `/vehicles/:id`
- [ ] RQ-3-05: `lib/api/telemetry.api.ts` debe exportar:
  - `getHistory(vehicleId: string, params?: { page?: number; limit?: number }): Promise<TelemetryPage>` → GET `/telemetry/:vehicleId`
  - `getLatest(vehicleId: string): Promise<Telemetry>` → GET `/telemetry/:vehicleId/latest`
- [ ] RQ-3-06: `lib/api/alerts.api.ts` debe exportar:
  - `getAlerts(): Promise<Alert[]>` → GET `/alerts`
  - `getVehicleAlerts(vehicleId: string): Promise<Alert[]>` → GET `/alerts/:vehicleId`
  - `resolveAlert(id: string): Promise<{ id: string; resolved: boolean; resolved_at: string }>` → PATCH `/alerts/:id/resolve`
- [ ] RQ-3-07: Todos los errores de red deben propagarse como excepciones; el manejo de errores corresponde a los hooks o los componentes que invocan las funciones de la API.

### Escenarios

**Escenario:** Request con token adjunta Authorization header
- Dado: el auth store tiene `token = "abc.def.ghi"`
- Cuando: se llama `getVehicles()`
- Entonces: la request HTTP incluye el header `Authorization: Bearer abc.def.ghi`

**Escenario:** Response 401 dispara logout
- Dado: el backend retorna HTTP 401 en cualquier request
- Cuando: el interceptor de response procesa la respuesta
- Entonces: se llama `logout()` en el auth store y el usuario es redirigido a `/login`

**Escenario:** getVehicles retorna array vacío sin error
- Dado: el backend responde con `[]`
- Cuando: se llama `getVehicles()`
- Entonces: la función retorna `[]` sin lanzar excepción

---

## Módulo 4: Socket Layer

### Objetivo
Implementar clientes WebSocket singleton por namespace que se conectan con el JWT del auth store y dispatch eventos al store correspondiente.

### Archivos afectados
- `lib/socket/socket.client.ts` — nuevo
- `lib/socket/telemetry.socket.ts` — nuevo
- `lib/socket/alerts.socket.ts` — nuevo

### Requisitos

- [ ] RQ-4-01: `lib/socket/socket.client.ts` debe exportar `getSocket(namespace: string): Socket` que retorna un singleton de `socket.io-client` por namespace. La URL base es `NEXT_PUBLIC_WS_URL`. El token JWT se pasa como `auth: { token }` en las opciones de conexión, leyéndolo de `useAuthStore.getState().token`.
- [ ] RQ-4-02: Si se llama `getSocket` con el mismo namespace dos veces, debe retornar la misma instancia (singleton); no crear una segunda conexión.
- [ ] RQ-4-03: `lib/socket/telemetry.socket.ts` debe exportar `subscribeTelemetry(onData: (telemetry: Telemetry) => void): () => void`. Internamente usa `getSocket("/telemetry")`, escucha el evento `"vehicle:location"`, y retorna una función de limpieza que desuscribe el listener.
- [ ] RQ-4-04: `lib/socket/alerts.socket.ts` debe exportar `subscribeAlerts(onAlert: (alert: Alert) => void): () => void`. Internamente usa `getSocket("/alerts")`, escucha el evento `"alert:created"`, y retorna una función de limpieza.
- [ ] RQ-4-05: Ambas funciones de suscripción deben ser seguras para llamar más de una vez: si se llaman de nuevo con un callback diferente, el listener anterior es reemplazado (no acumulado).
- [ ] RQ-4-06: El estado de conexión del socket (`connect`, `disconnect`, `reconnecting`) debe actualizar `useConnectivityStore` llamando `setWsStatus("LIVE" | "RECONNECTING" | "DISCONNECTED")`.

### Escenarios

**Escenario:** Singleton garantiza una sola conexión por namespace
- Dado: la app llama `getSocket("/telemetry")` desde dos hooks distintos
- Cuando: ambas llamadas ocurren durante el mismo ciclo de vida
- Entonces: se establece exactamente una conexión WebSocket al namespace `/telemetry`

**Escenario:** Evento vehicle:location actualiza vehicles store
- Dado: el socket `/telemetry` está conectado
- Cuando: el backend emite `vehicle:location` con `{ vehicle_id: "v1", lat: 4.65, lng: -74.05, speed: 60, ... }`
- Entonces: `useVehiclesStore.updateVehiclePosition("v1", telemetryData)` es llamado

**Escenario:** Desconexión marca wsStatus como RECONNECTING
- Dado: el socket estaba conectado y `wsStatus === "LIVE"`
- Cuando: se pierde la conexión WebSocket
- Entonces: `useConnectivityStore.setWsStatus("RECONNECTING")` es llamado

---

## Módulo 5: IndexedDB (offline)

### Objetivo
Persistir datos de vehículos, telemetría y alertas en IndexedDB para que la app funcione con datos en caché cuando el usuario está offline.

### Archivos afectados
- `lib/db/idb.client.ts` — nuevo
- `lib/db/vehicles.store.ts` — nuevo (IndexedDB store, no Zustand)
- `lib/db/telemetry.store.ts` — nuevo
- `lib/db/alerts.store.ts` — nuevo

### Requisitos

- [ ] RQ-5-01: `lib/db/idb.client.ts` debe exportar `openSimonDB(): Promise<IDBPDatabase>` usando `idb` que abre la base de datos `"simon-movilidad"` versión 1, con tres object stores: `"vehicles"` (keyPath: `"id"`), `"telemetry"` (keyPath: `"id"`), y `"alerts"` (keyPath: `"id"`).
- [ ] RQ-5-02: `openSimonDB` es idempotente: múltiples llamadas retornan la misma conexión (singleton por módulo).
- [ ] RQ-5-03: `lib/db/vehicles.store.ts` debe exportar:
  - `saveVehicles(vehicles: Vehicle[]): Promise<void>` — upsert batch usando `putAll`
  - `getVehicles(): Promise<Vehicle[]>` — retorna todos los registros del store `"vehicles"`
- [ ] RQ-5-04: `lib/db/telemetry.store.ts` debe exportar:
  - `saveTelemetry(records: Telemetry[]): Promise<void>` — upsert batch
  - `getTelemetry(vehicleId: string): Promise<Telemetry[]>` — retorna todos los registros del store `"telemetry"` filtrados por `vehicle_id`
- [ ] RQ-5-05: `lib/db/alerts.store.ts` debe exportar:
  - `saveAlerts(alerts: Alert[]): Promise<void>` — upsert batch
  - `getAlerts(): Promise<Alert[]>` — retorna todos los registros del store `"alerts"`
- [ ] RQ-5-06: Todas las funciones de IndexedDB son client-only. No deben importarse en código que corre en el servidor (sin `"use server"`). Los hooks que las usen deben verificar `typeof window !== "undefined"` antes de invocarlas.

### Escenarios

**Escenario:** Guardar y recuperar vehículos offline
- Dado: la app está offline y el IndexedDB tiene 5 vehículos guardados
- Cuando: se llama `getVehicles()` desde el IndexedDB store
- Entonces: retorna los 5 vehículos sin hacer ninguna petición HTTP

**Escenario:** Upsert no duplica registros
- Dado: el store `"vehicles"` tiene un registro con `id = "v1"`
- Cuando: se llama `saveVehicles([{ id: "v1", plate: "NEW-001", ... }])`
- Entonces: el store tiene exactamente 1 registro con `id = "v1"` con la placa actualizada

---

## Módulo 6: Hooks

### Objetivo
Encapsular la lógica de obtención de datos (fetch + suscripción WS + fallback IndexedDB + sincronización de stores) en hooks reutilizables.

### Archivos afectados
- `hooks/use-vehicles.ts` — nuevo
- `hooks/use-alerts.ts` — nuevo
- `hooks/use-telemetry-history.ts` — nuevo
- `hooks/use-map.ts` — nuevo
- `hooks/use-connectivity.ts` — nuevo
- `hooks/use-offline-sync.ts` — nuevo

### Requisitos

- [ ] RQ-6-01: `hooks/use-vehicles.ts` debe exportar `useVehicles()`. Al montarse: (1) llama `getVehicles()` API y despacha al vehicles store; (2) si falla y estamos offline, carga desde IndexedDB; (3) guarda en IndexedDB tras fetch exitoso; (4) suscribe a telemetría WS con `subscribeTelemetry`, actualizando `updateVehiclePosition` en el vehicles store por cada evento. Retorna `{ vehicles, isLoading, error }` del vehicles store.
- [ ] RQ-6-02: `hooks/use-alerts.ts` debe exportar `useAlerts()`. Al montarse: (1) llama `getAlerts()` API (solo si `role === "admin"`); (2) si falla offline, carga desde IndexedDB; (3) guarda en IndexedDB tras fetch exitoso; (4) suscribe a alertas WS con `subscribeAlerts`. Retorna `{ alerts, unresolvedCount }` del alerts store.
- [ ] RQ-6-03: `hooks/use-telemetry-history.ts` debe exportar `useTelemetryHistory(vehicleId: string, params?: { page?: number; limit?: number })`. Llama `getHistory(vehicleId, params)` y retorna `{ data, total, page, limit, isLoading, error }`. Refetch cuando cambia `vehicleId`.
- [ ] RQ-6-04: `hooks/use-map.ts` debe exportar `useMap(containerRef: RefObject<HTMLDivElement>)`. Inicializa un mapa MapLibre GL JS en el contenedor al montar. Retorna `{ map: maplibregl.Map | null, isReady: boolean }`. El mapa usa el estilo de mapa público (e.g. `https://demotiles.maplibre.org/style.json` o equivalente configurable via env). El hook limpia el mapa al desmontar.
- [ ] RQ-6-05: `hooks/use-map.ts` debe exponer también `addVehicleMarker(vehicleId: string, telemetry: Telemetry, status: UIVehicleStatus): void` y `updateVehicleMarker(vehicleId: string, telemetry: Telemetry, status: UIVehicleStatus): void` para que el componente `MapPanel` pueda gestionar marcadores sin acceder directamente a la instancia del mapa.
- [ ] RQ-6-06: `hooks/use-connectivity.ts` debe exportar `useConnectivity()`. Al montar: registra listeners `window.addEventListener("online", ...)` y `window.addEventListener("offline", ...)` y actualiza `useConnectivityStore`. Retorna `{ isOnline, wsStatus }` del connectivity store.
- [ ] RQ-6-07: `hooks/use-offline-sync.ts` debe exportar `useOfflineSync()`. Observa `isOnline` del connectivity store: cuando cambia de `false` a `true`, vuelve a ejecutar fetch de vehículos y alertas para sincronizar IndexedDB con el servidor. No retorna nada (side-effect puro).
- [ ] RQ-6-08: Todos los hooks deben limpiar sus suscripciones y listeners en la función de cleanup del `useEffect` (el retorno de unsubscribe de los sockets, y `removeEventListener` para la conectividad).

### Escenarios

**Escenario:** useVehicles hace fallback a IndexedDB si la API falla y está offline
- Dado: `isOnline = false` y el fetch a `GET /vehicles` falla con error de red
- Cuando: `useVehicles()` se monta
- Entonces: carga vehículos desde IndexedDB, `isLoading` pasa a `false`, y `error` es `null` (fallback exitoso)

**Escenario:** useAlerts no hace fetch si el usuario no es admin
- Dado: `user.role === "operator"`
- Cuando: `useAlerts()` se monta
- Entonces: no se llama `getAlerts()` ni `subscribeAlerts()`

**Escenario:** useOfflineSync re-fetcha al volver online
- Dado: la app estaba offline con datos stale en los stores
- Cuando: `isOnline` cambia de `false` a `true`
- Entonces: `getVehicles()` y `getAlerts()` son llamados nuevamente y los stores son actualizados

---

## Módulo 7: Rutas y auth

### Objetivo
Crear la estructura de rutas de la app con App Router de Next.js, protección de rutas con middleware, y páginas funcionales que consumen los hooks y stores.

### Archivos afectados
- `app/(auth)/login/page.tsx` — nuevo
- `app/(dashboard)/layout.tsx` — nuevo
- `app/(dashboard)/dashboard/page.tsx` — nuevo (reemplaza lógica de `app/page.tsx`)
- `app/(dashboard)/vehicles/page.tsx` — nuevo
- `app/(dashboard)/vehicles/[id]/page.tsx` — nuevo
- `app/(dashboard)/alerts/page.tsx` — nuevo
- `middleware.ts` — nuevo
- `app/page.tsx` — modificar (redirigir a `/dashboard`)

### Requisitos

- [ ] RQ-7-01: `middleware.ts` debe proteger todas las rutas bajo `/dashboard/*`, `/vehicles/*`, y `/alerts/*`. Si no existe `simon_auth` en las cookies (o si el token está ausente), redirige a `/login`. Usa `NextResponse.redirect`.
- [ ] RQ-7-02: La ruta `/alerts` debe estar además protegida para `role !== "admin"`: si el usuario no es admin, el middleware redirige a `/dashboard`.
- [ ] RQ-7-03: `app/(auth)/login/page.tsx` debe renderizar un formulario con campos `email` y `password`. Al submit llama `login()` de `auth.api.ts`, si exitoso llama `useAuthStore.login()` y redirige a `/dashboard`. Los errores de credenciales inválidas se muestran bajo el formulario (no un alert del navegador). La página no debe ser accesible si ya hay sesión (redirige a `/dashboard`).
- [ ] RQ-7-04: `app/(dashboard)/layout.tsx` es un Server Component (sin `"use client"`). Verifica el token en cookies; si no existe, llama `redirect("/login")`. Renderiza `DashboardLayout` (template existente) wrapeado en los providers necesarios (e.g. inicialización de hooks globales).
- [ ] RQ-7-05: `app/(dashboard)/dashboard/page.tsx` reemplaza la lógica de simulación de `app/page.tsx`. Debe usar `useVehicles()`, `useAlerts()`, `useConnectivity()`, y `useOfflineSync()`. El componente seleccionado por defecto es el primero del array de vehículos. No hay más `setInterval` con datos simulados.
- [ ] RQ-7-06: `app/(dashboard)/vehicles/page.tsx` debe mostrar una tabla de todos los vehículos usando datos de `useVehicles()`. Cada fila muestra: `id`, `plate`, `driver_name`, `status` (con `deriveUiStatus`), y un enlace a `/vehicles/:id`. Los vehículos admin pueden ser creados, editados y eliminados. Los operadores solo ven la tabla (sin botones de acción).
- [ ] RQ-7-07: `app/(dashboard)/vehicles/[id]/page.tsx` debe mostrar el detalle del vehículo incluyendo: datos del vehículo, última telemetría, y un gráfico de historial con `recharts` alimentado por `useTelemetryHistory(id)`. El gráfico debe mostrar `speed` y `fuel_level` en el tiempo.
- [ ] RQ-7-08: `app/(dashboard)/alerts/page.tsx` solo es accesible para admin (ver RQ-7-02). Muestra la lista de alertas de `useAlerts()` con botón "Resolver" que llama `resolveAlert(id)` de la API y actualiza el store.
- [ ] RQ-7-09: `app/page.tsx` debe ser reemplazado por una redirección simple a `/dashboard` usando `redirect()` de Next.js (Server Component).

### Escenarios

**Escenario:** Usuario no autenticado es redirigido al login
- Dado: no existe `simon_auth` en las cookies del navegador
- Cuando: el usuario navega a `/dashboard`
- Entonces: el middleware redirige a `/login` antes de renderizar la página

**Escenario:** Operador no puede acceder a /alerts
- Dado: el usuario está autenticado con `role: "operator"`
- Cuando: navega a `/alerts`
- Entonces: el middleware redirige a `/dashboard`

**Escenario:** Login exitoso redirige a dashboard
- Dado: la página de login está renderizada
- Cuando: el usuario ingresa credenciales válidas y hace submit
- Entonces: se llama `POST /auth/login`, el token se persiste en el auth store/cookie, y el usuario es redirigido a `/dashboard`

**Escenario:** Login fallido muestra error en la UI
- Dado: la página de login está renderizada
- Cuando: el usuario ingresa credenciales incorrectas y hace submit
- Entonces: la respuesta 401 se captura y se muestra un mensaje de error inline (e.g. "Credenciales inválidas") sin recargar la página

**Escenario:** Página de vehículo muestra gráfico de historial
- Dado: el usuario navega a `/vehicles/v-id-1`
- Cuando: `useTelemetryHistory("v-id-1")` resuelve con 50 registros
- Entonces: se renderiza un gráfico Recharts con los puntos de velocidad y nivel de combustible en el tiempo

---

## Módulo 8: Componentes adaptados

### Objetivo
Adaptar los componentes existentes (actualmente conectados a mocks) para consumir datos reales del backend a través de los hooks y stores, eliminando la dependencia de `lib/mock-data.ts` en runtime.

### Archivos afectados
- `components/organisms/MapPanel/MapPanel.tsx` — reescritura completa
- `components/molecules/VehicleCard/VehicleCard.tsx` — adaptación de campos
- `components/molecules/AlertRow/AlertRow.tsx` — adaptación de campos
- `components/organisms/Navbar/Navbar.tsx` — conectar a auth.store y alerts.store
- `components/organisms/Sidebar/Sidebar.tsx` — condicionar item "Alerts" a role=admin
- `components/organisms/RightColumn/RightColumn.tsx` — conectar a hooks reales
- `components/organisms/FleetStats/FleetStats.tsx` — solo conteos desde vehicles store

### Requisitos

- [ ] RQ-8-01: `MapPanel` debe ser reescrito para usar MapLibre GL JS en lugar del SVG mock. Debe usar `dynamic` de Next.js con `{ ssr: false }` para evitar errores de SSR con `maplibregl`. El contenedor del mapa debe tener un `height` explícito (e.g. `height: "100%"` con el contenedor padre teniendo altura definida). El componente usa `useMap()` para inicializar y gestionar marcadores.
- [ ] RQ-8-02: El `MapPanel` rediseñado debe mantener las mismas props de interfaz hacia el exterior: `fleet: Vehicle[]`, `selectedId: string`, `onSelect: (id: string) => void`. Los marcadores en el mapa representan vehículos usando `UIVehicleStatus` (derivado) para el color del pin.
- [ ] RQ-8-03: El `MapPanel` debe mostrar un popover al seleccionar un vehículo con: coordenadas GPS, velocidad, nivel de combustible, y `UIVehicleStatus` derivado. No muestra `maskId` ni el campo `head` crudo (el heading se computa desde telemetría con `computeHeading`).
- [ ] RQ-8-04: `VehicleCard` debe actualizar sus imports para usar los campos reales del backend: `plate` (igual), `driver_name` (era `driver`), y telemetría anidada en `latest_telemetry.speed`, `latest_telemetry.fuel_level`, `latest_telemetry.engine_temp`. Debe mostrar el `id` directamente (sin `maskId`). El `UIVehicleStatus` se obtiene via `deriveUiStatus`.
- [ ] RQ-8-05: `AlertRow` debe usar los campos del backend: `alert.severity` (era `alert.level`), `alert.message` (era `alert.title` + `alert.desc`), `alert.vehicle_id` (era `alert.device`/`alert.plate`), `alert.created_at` (era `alert.time`). La presentación visual (colores, iconos) se mantiene usando `severity` en lugar de `level`.
- [ ] RQ-8-06: `Navbar` debe leer el usuario autenticado de `useAuthStore()` y mostrarlo en `RoleBadge` (nombre, rol, iniciales). El conteo de notificaciones `Bell` debe venir de `useAlertsStore().unresolvedCount`. El `wsStatus` debe venir de `useConnectivityStore().wsStatus`.
- [ ] RQ-8-07: `Sidebar` debe condicionar la visibilidad del item "Alerts" al `role === "admin"` del usuario en el auth store. Los operadores no ven el item de alertas en la navegación lateral.
- [ ] RQ-8-08: `RightColumn` debe conectarse a hooks reales: el SparkBlock de velocidad usa datos de `useTelemetryHistory(selectedId, { limit: 32 })`, el SparkBlock de combustible usa los mismos datos, y la sección de alertas muestra `useAlerts().alerts.filter(a => a.vehicle_id === selectedId)`. Eliminar las importaciones de `ALERTS` y `genSeries` de mock-data.
- [ ] RQ-8-09: `FleetStats` debe implementarse solo con datos disponibles en el vehicles store: conteo de vehículos con `UIVehicleStatus === "active"`, `"idle"`, `"alert"`, `"offline"`, y total de vehículos. Las tarjetas de "Recorrido hoy" y "Consumo prom." que no tienen endpoint de soporte deben ser eliminadas. El `unresolvedCount` de alertas proviene del alerts store.
- [ ] RQ-8-10: Ningún componente adaptado debe importar desde `lib/mock-data.ts` en su versión final. El archivo `lib/mock-data.ts` puede permanecer en el repositorio (para referencia o tests futuros) pero no debe ser referenciado en componentes de producción.

### Escenarios

**Escenario:** MapPanel renderiza marcadores reales con MapLibre
- Dado: el mapa MapLibre está inicializado y `fleet` tiene 10 vehículos
- Cuando: `MapPanel` recibe el array de vehículos via props
- Entonces: el mapa muestra 10 marcadores en las coordenadas correctas con el color correspondiente al `UIVehicleStatus` de cada vehículo

**Escenario:** MapPanel no lanza error en SSR
- Dado: Next.js intenta renderizar el componente en el servidor
- Cuando: el dynamic import con `ssr: false` está configurado correctamente
- Entonces: no se lanza error de `window is not defined` ni similar durante el build

**Escenario:** VehicleCard muestra datos de telemetría anidada
- Dado: un `Vehicle` con `latest_telemetry: { speed: 72, fuel_level: 45, engine_temp: 83 }`
- Cuando: `VehicleCard` renderiza el vehículo
- Entonces: muestra "72 km/h", "45%", "83°C" en los MetricItems correspondientes

**Escenario:** Navbar muestra contador real de alertas
- Dado: `useAlertsStore().unresolvedCount === 7`
- Cuando: `Navbar` renderiza
- Entonces: el `Badge` sobre el ícono Bell muestra "7"

**Escenario:** Sidebar oculta item Alerts para operador
- Dado: `useAuthStore().user.role === "operator"`
- Cuando: `Sidebar` renderiza
- Entonces: el item de navegación "Alerts" no está presente en el DOM

**Escenario:** FleetStats muestra solo conteos reales
- Dado: el vehicles store tiene 8 vehículos activos, 2 idle, 1 alert, 1 offline
- Cuando: `FleetStats` renderiza
- Entonces: muestra las tarjetas con esos conteos; NO muestra tarjetas de "Recorrido hoy" ni "Consumo prom."

---

## Tabla de dependencias entre módulos

| Módulo | Depende de |
|--------|-----------|
| M1 (Tipos) | — |
| M2 (Stores) | M1 |
| M3 (API Layer) | M1, M2 |
| M4 (Socket Layer) | M1, M2 |
| M5 (IndexedDB) | M1 |
| M6 (Hooks) | M2, M3, M4, M5 |
| M7 (Rutas) | M1, M2, M3, M6 |
| M8 (Componentes) | M1, M2, M6 |

---

## Supuestos y riesgos asumidos

- **Heading**: el backend no envía bearing/heading en los datos de telemetría. Se asume que dos eventos consecutivos de `vehicle:location` para el mismo vehículo son suficientes para computar un heading razonable client-side. Si el backend emite menos de 2 eventos el heading inicial es `0`.
- **Estilo de mapa MapLibre**: el spec no prescribe un tile provider específico para producción. Se usa `demotiles.maplibre.org` como fallback de desarrollo. El equipo debe decidir el tile provider de producción y exponerlo via `NEXT_PUBLIC_MAP_STYLE_URL`.
- **Cookie vs localStorage para auth en middleware**: el middleware de Next.js no tiene acceso a `localStorage`. El token JWT debe guardarse también como cookie (httpOnly o accesible) para que el middleware pueda verificarlo. El `persist` de Zustand usa `localStorage` para el cliente; la cookie se debe establecer explícitamente al hacer login (e.g. vía `document.cookie` o una Server Action).
- **Paginación de telemetría**: se asume que el endpoint `GET /telemetry/:vehicleId` retorna los datos ordenados por `timestamp` descendente. Si el orden es diferente, los gráficos deben invertir el array.
- **WebSocket auth en namespace `/alerts`**: se asume que el backend valida el JWT en el handshake de socket.io y rechaza conexiones de no-admin al namespace `/alerts`. El frontend no necesita hacer validación adicional de rol para el socket.
- **Capacidad offline de IndexedDB**: no se define un límite de registros en el spec. El equipo debe considerar una política de TTL o máximo de registros para telemetría (que puede crecer indefinidamente).
