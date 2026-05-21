# Simon Movilidad

Monorepo TypeScript para la plataforma Simon Movilidad, que agrupa el frontend web, la app móvil y el servidor backend en un único repositorio gestionado con pnpm workspaces y Turborepo.

## Estructura

```
simon-movilidad/
├── apps/
│   ├── web/       # Next.js 16 — App Router, Tailwind CSS
│   ├── mobile/    # Expo SDK 54 — React Native, workflow gestionado
│   └── backend/   # NestJS 11 — API REST
├── packages/
│   ├── types/     # Interfaces TypeScript compartidas
│   └── config/    # Configuración base de TypeScript compartida
└── docs/          # Documentación del proyecto
```

## Apps y tecnologías

| App | Framework | Puerto dev |
|-----|-----------|-----------|
| `@simon/web` | Next.js 16 (App Router) | 3000 |
| `@simon/mobile` | Expo SDK 54 (React Native) | 8081 (Metro) |
| `@simon/backend` | NestJS 11 | 3001 |

## Primeros pasos

### Requisitos

- Node.js 22+
- pnpm 10+

### Instalar dependencias

```bash
pnpm install
```

### Ejecutar todos los servidores de desarrollo

```bash
pnpm dev
```

### Ejecutar una app específica

```bash
pnpm --filter @simon/web dev
pnpm --filter @simon/mobile start
pnpm --filter @simon/backend dev
```

### Build de producción

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```
