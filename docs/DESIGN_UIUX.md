# UI/UX Design System — Simón Movilidad Fleet Dashboard

Fleet IoT monitoring dashboard for Simón Movilidad. Spanish-language interface for fleet operators and administrators in Bogotá, Colombia. Visual identity derived from simonmovilidad.com: deep black background, electric lime accent.

---

## Design Tokens

Defined in `apps/web/app/globals.css` as CSS custom properties on `:root` and mapped to Tailwind v4 via `@theme inline`.

### Surfaces

| CSS Token         | Tailwind        | Value                 | Usage                              |
|-------------------|-----------------|-----------------------|------------------------------------|
| `--bg`            | `bg-bg`         | `#050505`             | Global background, navbar, sidebar |
| `--surface-1`     | `bg-surface-1`  | `#0c0c0d`             | Cards, inputs, default buttons     |
| `--surface-2`     | `bg-surface-2`  | `#131315`             | Hover states, active items         |
| `--surface-3`     | `bg-surface-3`  | `#1a1a1d`             | Tertiary elements, kbd             |

### Borders

| CSS Token               | Tailwind                  | Value                          |
|-------------------------|---------------------------|--------------------------------|
| `--hairline`            | `border-hairline`         | `rgba(255,255,255,0.06)`       |
| `--hairline-strong`     | `border-hairline-strong`  | `rgba(255,255,255,0.12)`       |

### Text

| CSS Token                | Tailwind                   | Value                          |
|--------------------------|----------------------------|--------------------------------|
| `--foreground`           | `text-foreground`          | `#f5f5f5`                      |
| `--foreground-muted`     | `text-foreground-muted`    | `rgba(245,245,245,0.55)`       |
| `--foreground-dim`       | `text-foreground-dim`      | `rgba(245,245,245,0.35)`       |

### Brand Accent

| CSS Token          | Tailwind           | Value                          |
|--------------------|--------------------|--------------------------------|
| `--accent`         | `bg-accent` / `text-accent` / `border-accent` | `#d4ff3d` |
| `--accent-soft`    | `bg-accent-soft`   | `rgba(212,255,61,0.12)`        |
| `--accent-line`    | `border-accent-line` | `rgba(212,255,61,0.32)`      |

### Semantic Colours

| Token            | Tailwind         | Value        | Usage                       |
|------------------|------------------|--------------|-----------------------------|
| `--danger`       | `text-danger`    | `#ff4d5e`    | Critical alerts, fuel       |
| `--danger-soft`  | `bg-danger-soft` | rgba         | Critical alert backgrounds  |
| `--warning`      | `text-warning`   | `#ffb547`    | Warnings, idle              |
| `--warning-soft` | `bg-warning-soft`| rgba         | Warning backgrounds         |
| `--success`      | `text-success`   | `#2bd67b`    | Online, available           |
| `--info`         | `text-info`      | `#5aa9ff`    | Informational               |

### Typography

| Family | Tailwind    | Fonts                                       | Usage                |
|--------|-------------|---------------------------------------------|----------------------|
| Sans   | `font-sans` | Geist → Inter → system-ui                   | All UI               |
| Mono   | `font-mono` | Geist Mono → JetBrains Mono → ui-monospace  | IDs, coords, numbers |

### Border Radius

| Token               | Tailwind       | Value    | Usage                       |
|---------------------|----------------|----------|-----------------------------|
| `--radius-sm`       | `rounded-sm`   | `6px`    | Buttons, inputs, chips      |
| `--radius-DEFAULT`  | `rounded`      | `10px`   | Cards, panels, popovers     |
| `--radius-lg`       | `rounded-lg`   | `14px`   | Modals, large panels        |
| `--radius-full`     | `rounded-full` | `9999px` | Pills, avatars, badges      |

---

## Atomic Design

### Atoms (`components/atoms/`)

Visual building blocks with no business logic.

| Component           | Key Props                              | Description                                  |
|---------------------|----------------------------------------|----------------------------------------------|
| `Button`            | `variant` (default/primary/ghost/icon) | Button with 4 style variants                 |
| `StatusDot`         | `variant`, `pulse`                     | Status dot with pulse animation              |
| `Badge`             | `count`                                | Red notification counter                     |
| `FuelBar`           | `value` (0–100)                        | Fuel bar with semantic colour                |
| `Avatar`            | `initials`                             | Circular avatar with initials                |
| `FilterChip`        | `label`, `dot`, `count`, `active`      | Toggleable filter chip                       |
| `VehicleStatusBadge`| `status`                               | Vehicle status badge (En ruta, etc.)         |
| `MetricItem`        | `label`, `value`, `unit`, `state`      | Metric with label, monospaced value and unit |

### Molecules (`components/molecules/`)

Atom combinations with a clear purpose.

| Component        | Description                                                    |
|------------------|----------------------------------------------------------------|
| `NavBrand`       | "S" logo + "simón." wordmark + subtitle                        |
| `SearchBox`      | Search input with ⌘K                                           |
| `RoleBadge`      | Role tag + name + avatar (pill)                                |
| `NavItem`        | Nav item with icon, label, and counter                         |
| `VehicleCard`    | Vehicle card: masked ID, status, coordinates, metrics          |
| `AlertRow`       | Alert row: semantic icon, title, description, timestamp        |
| `StatCard`       | KPI: label + large value + trend                               |
| `SparkBlock`     | SVG sparkline chart with label, value, and axes                |
| `AlertBanner`    | Critical fuel banner — connected to alerts store (dismissible) |
| `OfflineStrip`   | Offline mode indicator with real last-sync timestamp           |
| `ConnectionLine` | Sidebar footer row (WS, latency, GPS)                          |

### Organisms (`components/organisms/`)

Full sections with state.

| Component     | Description                                                               |
|---------------|---------------------------------------------------------------------------|
| `Navbar`      | Top bar: brand, breadcrumb, search, WS chip, notifications, user          |
| `Sidebar`     | Side bar: nav groups + connection footer                                  |
| `MapPanel`    | MapLibre GL map + animated markers + controls + legend + popovers         |
| `CardsStrip`  | Horizontal vehicle card strip with filters                                |
| `FleetStats`  | 2×3 KPI grid                                                              |
| `RightColumn` | Right panel: stats + sparklines + active alerts (admin-gated)             |

### Templates (`components/templates/`)

| Component         | Description                                    |
|-------------------|------------------------------------------------|
| `DashboardLayout` | App shell: navbar + sidebar + main grid        |

---

## App Structure

```
app/
├── globals.css          — CSS tokens + @theme inline (Tailwind v4)
├── layout.tsx           — Root layout with Geist fonts + metadata
└── page.tsx             — Live Map page

components/
├── atoms/               — 8 atoms
├── molecules/           — 11 molecules
├── organisms/           — 6 organisms
└── templates/           — 1 template

lib/
├── api/                 — Axios client + per-resource API modules
├── db/                  — IndexedDB stores (vehicles, telemetry, alerts)
├── socket/              — Socket.IO client + per-namespace handlers
├── cn.ts                — Class composition helper
└── fleet-utils.ts       — maskId, formatCoord, project, genSeries

stores/
├── alerts.store.ts      — Zustand: alert list + unresolved count
├── auth.store.ts        — Zustand: user session + JWT token
├── connectivity.store.ts— Zustand: online status + WS status + last sync
└── vehicles.store.ts    — Zustand: vehicle list + selected vehicle

types/
├── alert.types.ts       — Alert, AlertType
├── auth.types.ts        — User, LoginPayload
├── telemetry.types.ts   — TelemetryPoint
└── vehicle.types.ts     — Vehicle, VehicleStatus
```

---

## Vehicle Status Colour Palette

| Status    | Colour                | Token          |
|-----------|-----------------------|----------------|
| `active`  | Electric lime         | `--accent`     |
| `idle`    | Amber                 | `--warning`    |
| `alert`   | Red / pulsing         | `--danger`     |
| `offline` | Semi-transparent grey | `rgba(255,255,255,0.25)` |

---

## Animations

| Name         | Usage                                    |
|--------------|------------------------------------------|
| `pulse-ring` | Active status dots (StatusDot, WS chip)  |
| `pin-alert`  | Vehicle pin in `alert` state             |
