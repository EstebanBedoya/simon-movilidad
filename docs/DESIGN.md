# Design System — Simón Movilidad Fleet Dashboard

## Visión general

Dashboard de monitoreo de flota IoT para Simón Movilidad. Interfaz en español, orientada a operadores y administradores de flota en Bogotá, Colombia. Identidad visual extraída de simonmovilidad.com: fondo negro profundo, acento lima eléctrico.

---

## Tokens de diseño

Definidos en `apps/web/app/globals.css` como CSS custom properties en `:root` y mapeados a Tailwind v4 vía `@theme inline`.

### Superficies

| Token CSS         | Tailwind        | Valor                 | Uso                                |
|-------------------|-----------------|-----------------------|------------------------------------|
| `--bg`            | `bg-bg`         | `#050505`             | Fondo global, navbar, sidebar      |
| `--surface-1`     | `bg-surface-1`  | `#0c0c0d`             | Cards, inputs, botones default     |
| `--surface-2`     | `bg-surface-2`  | `#131315`             | Hover states, items activos        |
| `--surface-3`     | `bg-surface-3`  | `#1a1a1d`             | Elementos terciarios, kbd          |

### Bordes

| Token CSS               | Tailwind                  | Valor                          |
|-------------------------|---------------------------|--------------------------------|
| `--hairline`            | `border-hairline`         | `rgba(255,255,255,0.06)`       |
| `--hairline-strong`     | `border-hairline-strong`  | `rgba(255,255,255,0.12)`       |

### Texto

| Token CSS                | Tailwind                   | Valor                          |
|--------------------------|----------------------------|--------------------------------|
| `--foreground`           | `text-foreground`          | `#f5f5f5`                      |
| `--foreground-muted`     | `text-foreground-muted`    | `rgba(245,245,245,0.55)`       |
| `--foreground-dim`       | `text-foreground-dim`      | `rgba(245,245,245,0.35)`       |

### Acento de marca

| Token CSS          | Tailwind           | Valor                          |
|--------------------|--------------------|--------------------------------|
| `--accent`         | `bg-accent` / `text-accent` / `border-accent` | `#d4ff3d` |
| `--accent-soft`    | `bg-accent-soft`   | `rgba(212,255,61,0.12)`        |
| `--accent-line`    | `border-accent-line` | `rgba(212,255,61,0.32)`      |

### Semánticos

| Token            | Tailwind        | Valor        | Uso                      |
|------------------|-----------------|--------------|--------------------------|
| `--danger`       | `text-danger`   | `#ff4d5e`    | Alertas críticas, fuel   |
| `--danger-soft`  | `bg-danger-soft`| rgba         | Fondos de alerta crítica |
| `--warning`      | `text-warning`  | `#ffb547`    | Advertencias, idle       |
| `--warning-soft` | `bg-warning-soft`| rgba        | Fondos de advertencia    |
| `--success`      | `text-success`  | `#2bd67b`    | Online, disponible       |
| `--info`         | `text-info`     | `#5aa9ff`    | Información              |

### Tipografía

| Familia | Tailwind    | Fuentes                                     | Uso                  |
|---------|-------------|---------------------------------------------|----------------------|
| Sans    | `font-sans` | Geist → Inter → system-ui                   | Todo el UI           |
| Mono    | `font-mono` | Geist Mono → JetBrains Mono → ui-monospace  | IDs, coords, cifras  |

### Border radius

| Token               | Tailwind       | Valor   | Uso                         |
|---------------------|----------------|---------|-----------------------------|
| `--radius-sm`       | `rounded-sm`   | `6px`   | Botones, inputs, chips       |
| `--radius-DEFAULT`  | `rounded`      | `10px`  | Cards, panels, popovers      |
| `--radius-lg`       | `rounded-lg`   | `14px`  | Modales, panels grandes      |
| `--radius-full`     | `rounded-full` | `9999px`| Pills, avatares, badges      |

---

## Atomic Design

### Átomos (`components/atoms/`)

Bloques visuales sin lógica de negocio.

| Componente          | Props clave                        | Descripción                                  |
|---------------------|------------------------------------|----------------------------------------------|
| `Button`            | `variant` (default/primary/ghost/icon) | Botón con 4 variantes de estilo          |
| `StatusDot`         | `variant`, `pulse`                 | Punto de estado con animación de pulso        |
| `Badge`             | `count`                            | Contador rojo para notificaciones             |
| `FuelBar`           | `value` (0–100)                    | Barra de combustible con color semántico      |
| `Avatar`            | `initials`                         | Avatar circular con iniciales                 |
| `FilterChip`        | `label`, `dot`, `count`, `active`  | Chip de filtro toggleable                     |
| `VehicleStatusBadge`| `status`                           | Badge de estado del vehículo (En ruta, etc.)  |
| `MetricItem`        | `label`, `value`, `unit`, `state`  | Métrica con label, valor monoespaciado y unidad |

### Moléculas (`components/molecules/`)

Combinaciones de átomos con propósito claro.

| Componente       | Descripción                                                   |
|------------------|---------------------------------------------------------------|
| `NavBrand`       | Logo "S" + wordmark "simón." + subtítulo                      |
| `SearchBox`      | Input de búsqueda con ⌘K                                      |
| `RoleBadge`      | Tag de rol + nombre + avatar (pill)                           |
| `NavItem`        | Ítem de navegación con icono, label y contador                |
| `VehicleCard`    | Tarjeta de vehículo: ID enmascarado, estado, coordenadas, métricas |
| `AlertRow`       | Fila de alerta: ícono semántico, título, descripción, tiempo  |
| `StatCard`       | KPI: label + valor grande + tendencia                         |
| `SparkBlock`     | Gráfico sparkline SVG con label, valor y ejes                 |
| `AlertBanner`    | Banner crítico de combustible (dismissible)                   |
| `OfflineStrip`   | Indicador de modo offline                                     |
| `ConnectionLine` | Fila del footer del sidebar (WS, latencia, GPS)               |

### Organismos (`components/organisms/`)

Secciones completas con estado.

| Componente    | Descripción                                                               |
|---------------|---------------------------------------------------------------------------|
| `Navbar`      | Barra superior: brand, breadcrumb, búsqueda, WS chip, notifs, usuario    |
| `Sidebar`     | Barra lateral: grupos de nav + footer de conexión                         |
| `MapPanel`    | Mapa Bogotá SVG + pins animados + controles + leyenda + popovers          |
| `CardsStrip`  | Tira horizontal de tarjetas de vehículos con filtros                      |
| `FleetStats`  | Grid 2×3 de KPIs de flota                                                 |
| `RightColumn` | Panel derecho: estadísticas + sparklines + alertas activas                |

### Templates (`components/templates/`)

| Componente        | Descripción                                       |
|-------------------|---------------------------------------------------|
| `DashboardLayout` | Shell de la app: grid navbar + sidebar + main     |

---

## Estructura de la app

```
app/
├── globals.css          — Tokens CSS + @theme inline (Tailwind v4)
├── layout.tsx           — Root layout con Geist fonts + metadata
└── page.tsx             — Página Live Map (simulación de telemetría cada 2.2s)

components/
├── atoms/               — 8 átomos
├── molecules/           — 11 moléculas
├── organisms/           — 6 organismos
└── templates/           — 1 template

lib/
├── cn.ts                — Helper para composición de clases
├── fleet-utils.ts       — maskId, formatCoord, project, genSeries
└── mock-data.ts         — FLEET_SEED (10 vehículos) + ALERTS (6 items)

types/
└── fleet.ts             — Vehicle, Alert, VehicleStatus, AlertLevel
```

---

## Comportamiento mockeado

| Feature                     | Mock                                                            |
|-----------------------------|-----------------------------------------------------------------|
| Telemetría de vehículos     | `setInterval` 2.2s actualiza lat/lng/speed/temp/fuel en estado |
| WebSocket status            | Estado local `isOffline` + `wsStatus`                          |
| Búsqueda                    | Input visual sin funcionalidad                                  |
| Navegación sidebar          | `activeNav` en estado, sin routing real                        |
| Acciones de botones         | Botones visuales sin handlers                                   |
| Historial sparklines        | `genSeries()` — serie pseudorandom basada en `vehicle.id`      |
| Selección de vehículo       | Click en card o pin actualiza `selectedId` + sparklines        |

---

## Paleta de colores de vehículos por estado

| Estado    | Color            | Token          |
|-----------|------------------|----------------|
| `active`  | Lima eléctrico   | `--accent`     |
| `idle`    | Ámbar            | `--warning`    |
| `alert`   | Rojo / pulsante  | `--danger`     |
| `offline` | Gris semitransparente | `rgba(255,255,255,0.25)` |

---

## Animaciones

| Nombre        | Uso                                          |
|---------------|----------------------------------------------|
| `pulse-ring`  | Puntos de estado activos (StatusDot, WS chip)|
| `pin-alert`   | Pin de vehículo en estado `alert`            |
