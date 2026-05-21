# Spec: Fleet IoT Dashboard Components
**change-name**: fleet-dashboard-components
**project**: simon-movilidad
**date**: 2026-05-20
**status**: approved

---

## 1. Scope (delta — what must be true after the change)

This spec defines every file-system path, contract, and behavioural invariant that
must hold once the fleet IoT dashboard is implemented inside `apps/web/`. It covers
design tokens, TypeScript types, mock data helpers, all Atomic Design layers
(atoms → molecules → organisms → templates), the dashboard route, and the CSS
custom-property system.

It does NOT specify implementation steps, rendering algorithms, or which hooks to
use internally.

---

## 2. Design-token system

### 2.1 Location

All CSS custom properties MUST be declared in `apps/web/app/globals.css` under the
`:root` selector and MUST replace the existing placeholder variables.

### 2.2 Required tokens (exact names and values)

```css
:root {
  --bg:              #050505;
  --surface-1:       #0c0c0d;
  --surface-2:       #131315;
  --surface-3:       #1a1a1d;
  --hairline:        rgba(255,255,255,0.06);
  --hairline-strong: rgba(255,255,255,0.12);
  --text:            #f5f5f5;
  --text-muted:      rgba(245,245,245,0.55);
  --text-dim:        rgba(245,245,245,0.35);
  --accent:          #d4ff3d;
  --accent-soft:     rgba(212,255,61,0.12);
  --accent-line:     rgba(212,255,61,0.32);
  --danger:          #ff4d5e;
  --danger-soft:     rgba(255,77,94,0.12);
  --warning:         #ffb547;
  --warning-soft:    rgba(255,181,71,0.12);
  --success:         #2bd67b;
  --info:            #5aa9ff;
  --radius-sm:       6px;
  --radius:          10px;
  --radius-lg:       14px;
  --font-sans:       Inter, Geist, system-ui;
  --font-mono:       'JetBrains Mono', 'Geist Mono', ui-monospace;
}
```

No `@media (prefers-color-scheme)` toggle for these tokens — the dashboard is
dark-only. The `body` background MUST resolve to `var(--bg)`.

---

## 3. TypeScript types

### 3.1 Location

`apps/web/types/fleet.ts`

### 3.2 Required exports

| Export | Kind | Required fields |
|---|---|---|
| `VehicleStatus` | union type | `"active"` \| `"idle"` \| `"alert"` \| `"offline"` |
| `Vehicle` | interface | `id: string`, `maskedId: string`, `plate: string`, `driver: string`, `status: VehicleStatus`, `lat: number`, `lng: number`, `fuel: number` (0–100), `temp: number`, `speed: number`, `heading: number` |
| `Alert` | interface | `id: string`, `vehicleId: string`, `severity: "critical" \| "warning" \| "info"`, `message: string`, `timestamp: number` |
| `SparkSeries` | type alias | `number[]` |
| `FleetStats` | interface | `activeVehicles: number`, `availability: number`, `kmToday: number`, `fuelEfficiency: number`, `activeAlerts: number`, `iotUptime: number` |

All fields are non-optional unless the field represents a nullable telemetry
reading, in which case `| null` is permitted.

---

## 4. Mock data and utilities

### 4.1 `apps/web/lib/mock-data.ts`

Required exports:

| Export | Type | Contract |
|---|---|---|
| `FLEET_SEED` | `Vehicle[]` | Exactly 10 vehicles; IDs follow pattern `DEV-XXXX-XX00`; statuses distributed across all four `VehicleStatus` values (at least one of each); all numeric fields within realistic IoT ranges (fuel 0–100, temp 15–90°C, speed 0–120 km/h, heading 0–359) |
| `ALERTS` | `Alert[]` | At least 6 alerts; at least one per severity level; all `vehicleId` values reference IDs present in `FLEET_SEED` |
| `BOG_BOUNDS` | `{ north: number; south: number; east: number; west: number }` | Bogotá bounding box (approximate: north≈4.83, south≈4.47, east≈-73.99, west≈-74.22) |

### 4.2 `apps/web/lib/fleet-utils.ts`

Required exports:

| Export | Signature | Contract |
|---|---|---|
| `maskId` | `(id: string) => string` | Returns the id with the middle segment replaced by `****`; e.g. `"DEV-1234-XC54"` → `"DEV-****-XC54"` |
| `formatCoord` | `(n: number, axis: "lat" \| "lng") => string` | Returns a human-readable string with cardinal suffix, 4 decimal places |
| `project` | `(lat: number, lng: number, bounds: typeof BOG_BOUNDS) => { x: number; y: number }` | Converts lat/lng to a percentage (0–100) within the given bounds for SVG positioning; `x` is the east–west axis, `y` is the north–south axis (y=0 is north) |
| `genSeries` | `(length: number, min: number, max: number, seed?: number) => number[]` | Returns a deterministic (when `seed` is provided) array of `length` numbers in `[min, max]` |

---

## 5. Component tree

The following paths MUST exist under `apps/web/components/`.  
Each component folder MUST contain at minimum:
- `index.tsx` — the React component (default or named export matching the folder name)
- `{ComponentName}.module.css` — component-scoped styles

No component may import from a layer above its own (atoms cannot import molecules,
molecules cannot import organisms, etc.).

### 5.1 Atoms

| Path | Props contract | Visual contract |
|---|---|---|
| `atoms/Button/` | `variant: "primary" \| "ghost" \| "icon"`, `children`, `onClick?`, `disabled?`, `className?` | `primary` uses `--accent` bg + `#050505` text; `ghost` uses transparent bg + `--hairline-strong` border; `icon` is square with no label |
| `atoms/StatusDot/` | `status: VehicleStatus`, `pulse?: boolean` | Maps `active`→`--accent`, `idle`→`--warning`, `alert`→`--danger`, `offline`→`--text-dim`; `pulse=true` adds CSS keyframe animation |
| `atoms/StatusChip/` | `label: string`, `value: string`, `status: "ok" \| "warn" \| "error" \| "offline"` | Dot + label + value inline; uses `--surface-2` bg and `--hairline` border |
| `atoms/FuelBar/` | `percent: number` (0–100), `className?` | Thin `<progress>`-style bar; color is `--success` when ≥40, `--warning` when 20–39, `--danger` when <20 |
| `atoms/Avatar/` | `initials: string` (1–2 chars), `size?: "sm" \| "md"` | Circular, `--surface-3` bg, `--accent` text |
| `atoms/FilterChip/` | `label: string`, `active: boolean`, `onClick: () => void` | Pill shape; `active` state uses `--accent-soft` bg + `--accent` border + `--accent` text; inactive uses `--surface-2` bg |
| `atoms/VehicleStatusBadge/` | `status: VehicleStatus` | Maps status to Spanish label: `active`→"En ruta", `idle`→"Detenido", `alert`→"Alerta", `offline`→"Sin señal"; background uses the status-appropriate soft color |
| `atoms/MetricItem/` | `label: string`, `value: string \| number`, `unit?: string` | `label` in `--text-dim`, `value` in `--text` with `--font-mono`, `unit` in `--text-muted` |
| `atoms/Badge/` | `count: number`, `max?: number` (default 99) | Circular badge; `--danger` bg; truncates to `max+` |

### 5.2 Molecules

| Path | Props contract | Composition / visual contract |
|---|---|---|
| `molecules/NavBrand/` | `version?: string` | Brand mark square (28×28, `--accent` bg, "S" glyph) + wordmark "simón." / version string |
| `molecules/SearchBox/` | `placeholder?: string`, `shortcut?: string`, `onSearch?: (q: string) => void` | Input with search icon left, keyboard shortcut badge right; `--surface-2` bg |
| `molecules/RoleBadge/` | `role: string`, `name: string`, `initials: string` | Role tag + name + `Avatar`; separated by `--hairline` left border |
| `molecules/NavItem/` | `icon: React.ReactNode`, `label: string`, `count?: number`, `active?: boolean`, `onClick?: () => void` | Icon + label row; active state has `--accent-soft` bg and `--accent` left border; count shown as `Badge` |
| `molecules/VehicleCard/` | `vehicle: Vehicle` | Uses `StatusDot`, `VehicleStatusBadge`, `FuelBar`, `MetricItem`; shows masked ID, plate, driver, GPS coords (via `formatCoord`), fuel, temp, speed; `--surface-2` bg, `--radius` corners |
| `molecules/AlertRow/` | `alert: Alert` | Severity icon (lucide) + message + relative timestamp; background soft-color per severity |
| `molecules/StatCard/` | `label: string`, `value: string \| number`, `unit?: string`, `trend?: number`, `trendLabel?: string` | KPI block; large value in `--font-mono`; positive trend in `--success`, negative in `--danger` |
| `molecules/SparkBlock/` | `series: number[]`, `label: string`, `currentValue: string \| number`, `unit?: string`, `color?: string` | SVG inline sparkline (no external lib) + label + value; axes are optional tick marks |
| `molecules/AlertBanner/` | `vehicleId: string`, `message: string`, `onDismiss: () => void`, `ctaLabel?: string`, `onCta?: () => void` | Danger gradient bg; dismissible (`×` icon button); "Admin only" badge; `--danger` CTA button |
| `molecules/OfflineStrip/` | `visible: boolean` | Full-width amber banner; renders `null` when `visible=false` |
| `molecules/MapPin/` | `vehicle: Vehicle`, `svgX: number`, `svgY: number`, `selected?: boolean`, `onClick?: () => void` | SVG `<g>` element; circle marker + heading indicator line; color by status; label appears on hover; popover (basic stats) appears when `selected` |
| `molecules/ConnectionLine/` | `icon: React.ReactNode`, `label: string`, `value: string`, `status: "ok" \| "warn" \| "error"` | Single status row for sidebar footer |

### 5.3 Organisms

| Path | Props contract | Composition contract |
|---|---|---|
| `organisms/Navbar/` | `notificationCount?: number`, `wsStatus?: "connected" \| "disconnected" \| "reconnecting"` | Contains `NavBrand`, `SearchBox`, `StatusChip` (WS), notification bell with `Badge`, help icon button, `RoleBadge`; fixed at top, height exactly 56px, `--surface-1` bg, `--hairline` bottom border |
| `organisms/Sidebar/` | `activeItem?: string`, `onNavigate?: (item: string) => void` | Contains `NavItem` list (two groups separated by `--hairline`); footer with four `ConnectionLine` rows (WS latency, GPS, mode, connectivity); width exactly 232px; `--surface-1` bg, `--hairline-strong` right border |
| `organisms/MapPanel/` | `vehicles: Vehicle[]`, `selectedId?: string`, `onSelectVehicle?: (id: string) => void` | SVG basemap (abstract Bogotá street grid drawn in SVG `<path>` elements); overlays `MapPin` for each vehicle using `project()`; map controls (zoom in/out, layers, center as icon buttons); map legend showing status-to-color mapping; info pills top-left |
| `organisms/FleetStats/` | `stats: FleetStats` | Grid of 6 `StatCard` components: active vehicles, availability %, km today, fuel efficiency, active alerts, IoT uptime |
| `organisms/CardsStrip/` | `vehicles: Vehicle[]`, `selectedId?: string`, `onSelectVehicle?: (id: string) => void` | Filter chip row (all / en ruta / detenidos / con alerta / sin señal); horizontally scrollable `VehicleCard` list filtered by active chip; full-width |
| `organisms/RightColumn/` | `vehicles: Vehicle[]`, `alerts: Alert[]`, `selectedVehicle?: Vehicle \| null` | Contains optional `OfflineStrip`, `FleetStats`, two `SparkBlock` (speed history + fuel history for selected vehicle), `AlertRow` list; fixed 380px width |

### 5.4 Templates

| Path | Props contract | Layout contract |
|---|---|---|
| `templates/DashboardLayout/` | `children: React.ReactNode` | CSS Grid shell: Navbar spans full top (56px); Sidebar occupies left column (232px); main content area fills the remainder; no horizontal scroll on the outer shell |

---

## 6. Route and page

### 6.1 `apps/web/app/page.tsx`

The default export MUST render the full dashboard. It MUST:

- Import `FLEET_SEED` and `ALERTS` from `@/lib/mock-data`.
- Maintain a `vehicles` state array initialised from `FLEET_SEED`.
- Maintain a `selectedId` state (initially the first vehicle's id).
- Run a `useInterval` (or `useEffect` + `setInterval`) at exactly **2200 ms** to
  mutate each vehicle's `fuel`, `temp`, `speed`, and `heading` within realistic
  bounds, simulating live telemetry.
- Maintain a `dismissedBanner` boolean state; when `false` render `AlertBanner` for
  the first critical alert.
- Derive `FleetStats` from the current `vehicles` state on every render (no stale
  cache beyond the render cycle).
- Compose `DashboardLayout` > `Navbar` + `Sidebar` + (`MapPanel` | `RightColumn`) +
  `CardsStrip`.

### 6.2 `apps/web/app/layout.tsx`

MUST set:
- `<html lang="es">` (Spanish)
- `metadata.title` = `"simón. Fleet Ops"`
- `metadata.description` = `"Panel de operaciones de flota"`
- Body background resolved from `var(--bg)`
- Inter (or Geist) loaded via `next/font/google` with variable `--font-sans`

---

## 7. CSS module contracts

Each `.module.css` file MUST use only CSS custom properties from the design-token
set (section 2) for colors, radii, and typography. Hard-coded hex color values are
not permitted inside component CSS modules.

Tailwind utility classes MUST NOT appear inside `.module.css` files.  
Tailwind layout utilities (e.g. `flex`, `grid`) MAY be used on the outermost
wrapper element of a page or template, but NOT inside atoms, molecules, or
organisms.

---

## 8. External dependencies

| Package | Usage | Constraint |
|---|---|---|
| `lucide-react` | Icons throughout | MUST be added to `apps/web/package.json` dependencies if not already present |
| `next/font/google` | Inter / Geist loading | Already available via Next.js |

No external map library (Mapbox, Leaflet, etc.) may be introduced. The basemap
MUST be a hand-crafted SVG.

No charting library (Chart.js, Recharts, etc.) may be introduced. Sparklines MUST
be inline SVG `<polyline>` or `<path>` elements.

---

## 9. Docs file

`docs/DESIGN.md` MUST exist and contain:

- The design-token table (all 22 tokens with name, value, and semantic meaning)
- A description of each dashboard section
- The Atomic Design hierarchy as a directory tree
- Notes on the SVG basemap coordinate system
- Notes on the mock telemetry simulation interval

---

## 10. Acceptance scenarios

### S-1: Dev server starts

```
Given  `pnpm install` has completed at the repo root
When   `pnpm --filter @simon/web dev` is run
Then   the Next.js dev server starts on port 3000
And    `GET /` returns HTTP 200
And    the process does not exit within 10 seconds
```

### S-2: Dashboard renders without console errors

```
Given  the dev server is running
When   a browser loads `localhost:3000/`
Then   the Navbar is visible (height 56px, contains "simón." wordmark)
And    the Sidebar is visible (width 232px, contains navigation groups)
And    the MapPanel SVG basemap is present in the DOM
And    at least one VehicleCard is visible in the CardsStrip
And    the RightColumn FleetStats grid shows 6 KPI values
And    the browser console has zero errors (warnings from third-party libs are acceptable)
```

### S-3: Simulated telemetry updates vehicle cards

```
Given  the dashboard is rendered
When   2200ms elapses (one telemetry tick)
Then   at least one VehicleCard shows a changed speed, fuel, or temp value
And    no console error is thrown during the update
And    after 5 ticks (≈11 seconds) all 10 vehicle cards have had at least one field updated
```

### S-4: Vehicle selection updates RightColumn sparklines

```
Given  the dashboard is rendered with vehicle A selected (first card)
When   the user clicks a VehicleCard for vehicle B
Then   vehicle B becomes the selected vehicle
And    the RightColumn SparkBlock for speed shows a series corresponding to vehicle B
And    the RightColumn SparkBlock for fuel shows a series corresponding to vehicle B
And    MapPanel highlights the pin for vehicle B
```

### S-5: Alert banner can be dismissed

```
Given  a critical alert exists in ALERTS for at least one vehicle
And    the alert banner has not yet been dismissed
When   the dashboard is first rendered
Then   the AlertBanner is visible above the map area
When   the user clicks the dismiss button
Then   the AlertBanner is no longer in the DOM
And    it does not reappear unless the page is refreshed
```

### S-6: Filter chips filter vehicle cards

```
Given  the CardsStrip is rendered with all 10 vehicles
When   the user clicks the "En ruta" filter chip
Then   only vehicles with status="active" are shown in the card list
When   the user clicks "Con alerta"
Then   only vehicles with status="alert" are shown
When   the user clicks "Sin señal"
Then   only vehicles with status="offline" are shown
When   the user clicks "Todos" (all)
Then   all 10 vehicles are shown again
```

### S-7: TypeScript compiles with no errors

```
Given  `pnpm install` has completed
When   `pnpm --filter @simon/web exec tsc --noEmit` is run
Then   exit code is 0
And    zero type errors are reported to stdout
```

---

## 11. Out of scope

- Real WebSocket connection or live GPS feed
- Authentication, role management, or user sessions
- Any backend API endpoint
- Unit or integration tests
- Mobile or tablet responsive layout (desktop-first only)
- Accessibility audit (WCAG compliance is not required for this change)
- Production build optimisation or bundle analysis
- i18n beyond the use of Spanish strings in UI labels

---

## 12. Constraints carried from context (non-negotiable)

1. **Dark-only palette** — no light-mode toggle; `:root` tokens are unconditional.
2. **CSS modules only** — no Tailwind inside component internals; Tailwind stays
   as a layout utility on page-level wrappers only.
3. **No external map or chart libraries** — SVG only.
4. **`lucide-react` for all icons** — no other icon package.
5. **TypeScript strict mode** — `strict: true` inherited from `tsconfig.base.json`;
   the `tsc --noEmit` check MUST pass.
6. **Telemetry interval exactly 2200 ms** — acceptance scenario S-3 tests this
   boundary; jitter within ±50 ms is acceptable.
7. **10 vehicles in FLEET_SEED** — all 10 MUST render as cards initially (before
   filtering).
8. **Masked IDs** — vehicle IDs displayed in UI MUST use `maskId()` from
   `fleet-utils.ts`; raw IDs MUST NOT appear in rendered output.
9. **No `pages/` directory** — routing is entirely under `apps/web/app/` (App
   Router).
