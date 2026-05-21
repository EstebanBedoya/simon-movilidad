# Spec: TypeScript Monorepo Setup
**change-name**: typescript-monorepo-setup
**project**: simon-movilidad
**date**: 2026-05-20
**status**: approved

---

## 1. Scope (delta — what must be true after the change)

This spec defines the complete file-system state, configuration invariants, and
behavioural contracts that must hold once the monorepo scaffold is applied to
`/Users/ebedoya/Projects/simon-movilidad`. It does NOT specify implementation
steps or tool commands.

---

## 2. Directory structure

After the change the repository root MUST contain exactly this top-level layout
(files that already exist — `.git/`, `.claude/` — are unaffected):

```
simon-movilidad/
├── apps/
│   ├── web/
│   ├── mobile/
│   └── backend/
├── packages/
│   ├── types/
│   └── config/
├── docs/
│   └── README.md
├── turbo.json
├── pnpm-workspace.yaml
├── .npmrc
├── tsconfig.base.json
└── package.json
```

No `ios/` or `android/` directories exist anywhere in the repository.
No `nest-cli.json` (NestJS CLI monorepo mode) exists at any path.

---

## 3. Root-level file contracts

### 3.1 `package.json`

**Required fields and values:**

| Field | Required value / constraint |
|---|---|
| `private` | `true` |
| `packageManager` | `"pnpm@9.x.x"` (exact patch version pinned) |
| `scripts.dev` | `"turbo dev"` |
| `scripts.build` | `"turbo build"` |
| `scripts.lint` | `"turbo lint"` |
| `pnpm.overrides.react` | pinned to the exact version required by the Expo SDK in use |
| `pnpm.overrides.react-native` | pinned to the exact version required by the Expo SDK in use |
| `pnpm.overrides.expo` | pinned to the Expo SDK version in use |

No `workspaces` field (that lives in `pnpm-workspace.yaml`).
A `devDependencies` entry for `turbo` MUST be present.

### 3.2 `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

No other entries are required; additional entries (e.g. `docs/`) are permitted
but not mandatory.

### 3.3 `.npmrc`

MUST contain the line:
```
node-linker=hoisted
```

This line is required for Metro (React Native bundler) to resolve packages
correctly in a hoisted layout.

### 3.4 `turbo.json`

MUST declare the following pipeline tasks:

| Task | `cache` | `persistent` | `outputs` |
|---|---|---|---|
| `build` | `true` (default) | `false` (default) | `[".next/**", "dist/**"]` |
| `dev` | `false` | `true` | — |
| `lint` | `true` | `false` | — |
| `test` | `true` | `false` | — |

`build` MUST declare `"dependsOn": ["^build"]` so dependency packages are built
before consumers.

`dev` MUST NOT have `dependsOn` (all dev servers start concurrently).

### 3.5 `tsconfig.base.json`

MUST include the following compiler options set to the stated values:

| Option | Value |
|---|---|
| `strict` | `true` |
| `skipLibCheck` | `true` |
| `esModuleInterop` | `true` |
| `forceConsistentCasingInFileNames` | `true` |
| `declaration` | `true` |
| `moduleResolution` | `"bundler"` or `"node16"` |

No `paths` aliases are defined in this file (per NestJS SWC builder constraint).

---

## 4. App-level contracts

### 4.1 `apps/web` — Next.js

| Contract | Required value |
|---|---|
| Framework | Next.js (latest stable at scaffold time) |
| Router | App Router (`app/` directory, NOT `pages/`) |
| Language | TypeScript |
| CSS | Tailwind CSS configured via `tailwind.config.ts` |
| `tsconfig.json` | `extends` `../../tsconfig.base.json` |
| `package.json` name | `"@simon/web"` |
| `package.json` scripts | `dev`, `build`, `lint`, `start` |

A `next.config.ts` (or `.js`) MUST be present.
No `pages/` directory exists; routing lives under `app/`.

### 4.2 `apps/mobile` — Expo Managed

| Contract | Required value |
|---|---|
| Framework | Expo SDK (latest stable at scaffold time), managed workflow |
| Language | TypeScript |
| `app.json` | `expo.name` and `expo.slug` set; `expo.newArchEnabled: true` recommended |
| `tsconfig.json` | `extends` `../../tsconfig.base.json` |
| `package.json` name | `"@simon/mobile"` |
| `package.json` scripts | `start`, `android`, `ios`, `web` |

No `ios/` directory exists.
No `android/` directory exists.
An `app.json` (or `app.config.ts`) MUST be present.
An `expo-router` or standard Expo entry point MUST be present.

### 4.3 `apps/backend` — NestJS Standalone

| Contract | Required value |
|---|---|
| Framework | NestJS (latest stable at scaffold time) |
| Mode | Standalone app (NOT nest CLI monorepo mode) |
| Language | TypeScript |
| `tsconfig.json` | `extends` `../../tsconfig.base.json`; additionally sets `emitDecoratorMetadata: true` and `experimentalDecorators: true` |
| `package.json` name | `"@simon/backend"` |
| `package.json` scripts | `dev` (or `start:dev`), `build`, `start`, `lint` |

`nest-cli.json` (if present) MUST NOT contain `"monorepo": true`.
No `apps/` subdirectory exists inside `apps/backend/` (no nested NestJS monorepo
layout).
SWC builder MAY be used, but NO `paths` aliases in tsconfig are relied upon
(workaround for SWC limitation).

---

## 5. Package-level contracts

### 5.1 `packages/types`

| Contract | Required value |
|---|---|
| `package.json` name | `"@simon/types"` |
| `package.json` main | `"./src/index.ts"` or compiled `"./dist/index.js"` with `types` pointing to `./dist/index.d.ts` |
| `tsconfig.json` | `extends` `../../tsconfig.base.json` |
| Content | At least one exported TypeScript interface or type (e.g. `User`, `ApiResponse`) to prove the package is valid |
| Consumed by | `apps/web`, `apps/mobile`, and `apps/backend` MUST list `@simon/types` as a workspace dependency (`workspace:*`) |

### 5.2 `packages/config`

| Contract | Required value |
|---|---|
| `package.json` name | `"@simon/config"` |
| Content | Re-exports `tsconfig.base.json` as `tsconfig/base.json` so consumers can write `"extends": "@simon/config/tsconfig/base"` |
| `package.json` exports | `"./tsconfig/base": "./tsconfig.base.json"` (or equivalent) |

---

## 6. `docs/README.md`

MUST exist and MUST contain at minimum:

- Project name (`simon-movilidad`)
- A one-paragraph overview of the monorepo structure
- A section listing the three apps and their tech stacks
- A "Getting started" section with the commands to install dependencies and run dev servers

---

## 7. Acceptance scenarios

### S-1: Workspace installation succeeds

```
Given  the repository is freshly cloned (no node_modules)
When   `pnpm install` is run at the repo root
Then   all workspace packages are resolved without dependency conflicts
And    no duplicate runtime instances of react or react-native are installed
And    node_modules layout is hoisted (packages visible at root node_modules)
```

### S-2: Web dev server starts

```
Given  `pnpm install` has completed successfully
When   `pnpm --filter @simon/web dev` (or `turbo dev --filter=@simon/web`) is run
Then   the Next.js dev server starts on a local port (default 3000)
And    the root page renders without runtime errors
And    the process does not exit within 10 seconds
```

### S-3: Mobile dev server starts

```
Given  `pnpm install` has completed successfully
When   `pnpm --filter @simon/mobile start` is run
Then   the Expo dev server (Metro) starts without bundler errors
And    the QR code or local URL is printed to stdout
And    the process does not exit within 10 seconds
```

### S-4: Backend dev server starts

```
Given  `pnpm install` has completed successfully
When   `pnpm --filter @simon/backend dev` (or `start:dev`) is run
Then   the NestJS application boots and logs "Application is running on: http://localhost:<port>"
And    the process does not exit within 10 seconds
```

### S-5: Root-level TypeScript check passes

```
Given  `pnpm install` has completed successfully
When   `tsc --noEmit` is run from the repo root (using tsconfig.base.json as reference)
Then   zero TypeScript errors are reported
```

### S-6: Turbo build completes for all apps

```
Given  `pnpm install` has completed successfully
And    environment variables required by each app are present (or mocked)
When   `pnpm build` is run at the repo root
Then   turbo executes build tasks in dependency order
And    `apps/web` produces a `.next/` output directory
And    `apps/backend` produces a `dist/` output directory
And    the Expo managed build completes (or is explicitly excluded from CI turbo pipeline with a note)
And    `packages/types` produces declaration files in `dist/`
And    zero TypeScript errors are emitted during any build task
```

### S-7: Lint passes across all packages

```
Given  `pnpm install` has completed successfully
When   `pnpm lint` is run at the repo root
Then   turbo runs lint in all apps and packages
And    zero lint errors are reported (warnings are acceptable)
```

### S-8: No NestJS monorepo mode contamination

```
Given  the repository after scaffold
When   any file under `apps/backend/` is inspected
Then   `nest-cli.json` does NOT contain `"monorepo": true`
And    no `apps/` subdirectory exists inside `apps/backend/`
And    no `libs/` subdirectory exists inside `apps/backend/`
```

### S-9: Expo CNG compliance

```
Given  the repository after scaffold
When   the repository tree is inspected
Then   no `ios/` directory exists anywhere in the repository
And    no `android/` directory exists anywhere in the repository
And    `apps/mobile/app.json` (or `app.config.ts`) exists with valid Expo config
```

### S-10: pnpm-lock.yaml at repo root

```
Given  `pnpm install` has been run once
When   the repo root is inspected
Then   `pnpm-lock.yaml` exists at the root (NOT inside any app directory)
And    the file is committed to version control
```

---

## 8. Out of scope for this change

- CI/CD pipeline configuration (GitHub Actions, EAS Build)
- Authentication or application business logic
- Database setup or ORM configuration
- Environment variable management beyond what scaffold tools create by default
- Production deployment configuration
- Any app-specific UI components or screens beyond the scaffold default

---

## 9. Constraints carried from exploration (non-negotiable)

1. `node-linker=hoisted` in `.npmrc` — Metro requires flat node_modules.
2. NestJS MUST be scaffolded in standalone mode — nest CLI monorepo mode breaks
   Turborepo task isolation.
3. `pnpm.overrides` for `react`, `react-native`, and `expo` in root `package.json`
   — prevents duplicate React runtime which crashes React Native at startup.
4. No `paths` aliases in tsconfig files used by NestJS backend — SWC builder
   silently ignores them causing import resolution failures at runtime.
5. `packageManager` field MUST be present in root `package.json` — required by
   EAS (Expo Application Services) to detect the correct package manager.
6. `pnpm-lock.yaml` MUST be at repo root — EAS reads it from there for
   reproducible installs.
