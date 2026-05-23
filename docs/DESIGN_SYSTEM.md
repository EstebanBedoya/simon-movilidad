# Technical Design — Simón Movilidad Fleet Dashboard

Stack choices and technical tradeoffs for the IoT fleet monitoring system.

---

## Backend — NestJS (TypeScript) instead of Go/C#

The test suggests Go or C#. I chose **NestJS** for the following reasons:

| Factor | Decision |
|---|---|
| **Expertise** | Deep TypeScript/Node.js background; Go would be learning-on-the-clock for a 72h test |
| **Monorepo coherence** | Single language across the stack minimises context switching and shared type definitions |
| **Feature velocity** | NestJS's module/decorator system ships auth, validation, WebSockets, and DI in hours, not days |
| **Test story** | Jest + NestJS testing utilities allow integration tests with real DI context without extra tooling |

**Tradeoffs accepted:**
- Go would give ~5–10× better throughput for raw telemetry ingestion at scale. For a demo with simulated IoT data, this is irrelevant.
- NestJS runtime is heavier (~80–120 MB resident) vs a Go binary (~10 MB).
- No static binary compilation — deploying Node.js requires a runtime, whereas Go produces a self-contained executable.

---

## JWT — Manual Implementation (no external library)

The requirement explicitly asked for JWT without external validation libraries. Implementation uses Node's built-in `crypto` module:

```
header.payload.HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)
```

**Why this matters:** Using `jsonwebtoken` or `@nestjs/jwt` abstracts away the signing and verification logic. A manual implementation proves understanding of the actual spec (RFC 7519): base64url encoding, the three-part structure, HMAC-SHA256 signing, and expiry checking via `iat`/`exp` claims.

**Tradeoff:** The manual implementation does not support RSA/ECDSA asymmetric signing or token refresh out of the box. For production, `jose` (Web Crypto API-based) would be the right choice.

---

## Database — PostgreSQL (not SQLite)

| Factor | PostgreSQL | SQLite |
|---|---|---|
| Concurrent writes | Row-level locking | File-level locking |
| JSON operators | Native `jsonb` | Limited |
| Production parity | ✅ Matches prod deployments | ❌ File-based, diverges in prod |
| Local setup | Docker Compose | Zero setup |

Chose **PostgreSQL** because the system ingests telemetry from multiple vehicles simultaneously — SQLite's file-level write lock would serialize those inserts and create backpressure. Docker Compose makes local setup a single command.

---

## Real-time — Socket.IO over native WebSocket

| Factor | Socket.IO | Native WS |
|---|---|---|
| Automatic reconnection | ✅ Built-in | ❌ Manual |
| Room/namespace primitives | ✅ Native | ❌ Manual |
| Fallback transports | ✅ Long-polling on failure | ❌ None |
| Bundle size | +~45 KB client | ~0 KB |

Chose **Socket.IO** for the room-based access control: the `/alerts` namespace rejects non-admin connections at the middleware level, and `vehicle:location` events are emitted to role-based rooms. Native WS would require implementing all of this manually.

**Tradeoff:** ~45 KB extra on the client bundle. Acceptable for an internal fleet dashboard.

---

## Frontend Map — MapLibre GL instead of Google Maps

| Factor | MapLibre GL | Google Maps JS API |
|---|---|---|
| Cost | Free (OSM tiles via OpenFreeMap) | Billing after 28K loads/month |
| Bundle | Self-contained | External script load |
| Customisation | Full style control via JSON | Limited to API options |
| Offline tiles | Possible with self-hosted tiles | Not possible |

**MapLibre** is the open-source fork of Mapbox GL JS. It renders via WebGL, supports custom styles, and has zero per-request billing. The tile server used (`tiles.openfreemap.org`) is free for development.

**Tradeoff:** Google Maps has better geocoding, Street View integration, and wider developer familiarity.

---

## Offline Strategy — IndexedDB over localStorage

| Factor | IndexedDB | localStorage |
|---|---|---|
| Storage limit | ~50% of disk | ~5–10 MB |
| Data types | Structured objects, binary | Strings only |
| Async API | ✅ Non-blocking | ❌ Synchronous (blocks main thread) |
| Querying | Indexes + cursors | Key-value only |

For a fleet dashboard caching vehicle records, telemetry history, and alert lists, **IndexedDB** is the correct choice. localStorage's 5–10 MB limit and synchronous I/O would degrade the UI when the cache is large.

The `idb` library wraps IndexedDB with a Promise-based API — it is a thin ergonomic wrapper, not an abstraction that hides IndexedDB semantics.

---

## Monorepo — Turborepo + pnpm

`pnpm` workspaces enforce strict dependency isolation (no phantom dependencies). Turborepo adds:
- Remote caching — rebuild only what changed
- Parallel task execution across apps/packages
- Dependency-aware task graph (backend builds before frontend if needed)

**Tradeoff:** Turborepo adds ~10 MB to devDependencies and a `turbo.json` config. For a two-app monorepo this is slight overkill, but it aligns with production monorepo patterns used by large teams.

---

## Privacy — Server-side Device ID Masking

Device ID masking (`DEV-****-XC54`) is enforced **server-side**, not in the frontend. The API and WebSocket gateway both call `maskDeviceId()` before sending a response, based on the authenticated user's role.

This means a non-admin user cannot see raw device IDs even if they intercept network traffic or inspect the Zustand store. A frontend-only masking approach would be trivially bypassable via DevTools.
