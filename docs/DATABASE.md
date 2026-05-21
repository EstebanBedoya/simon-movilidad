# Simon Movilidad — Entity Relationship Diagram

## Diagrama ER

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK "NOT NULL"
        varchar password_hash "NOT NULL, select:false"
        enum role "admin | user, DEFAULT user"
        timestamp created_at "DEFAULT NOW()"
    }

    vehicles {
        uuid id PK
        varchar device_id UK "NOT NULL, ej: DEV-A1B2-XC54"
        varchar name "NOT NULL"
        enum city "medellin|bogota|cali|barranquilla|cartagena|bucaramanga"
        enum status "active | inactive, DEFAULT active"
        timestamp created_at "DEFAULT NOW()"
    }

    telemetry {
        uuid id PK
        uuid vehicle_id FK "NOT NULL"
        decimal lat "precision(10,7) NOT NULL"
        decimal lng "precision(10,7) NOT NULL"
        decimal speed "precision(5,2) NULLABLE, km/h"
        decimal fuel_level "precision(5,2) NULLABLE, 0-100%"
        decimal temperature "precision(5,2) NULLABLE, °C motor"
        timestamp timestamp "NOT NULL"
    }

    alerts {
        uuid id PK
        uuid vehicle_id FK "NOT NULL"
        enum type "low_fuel|high_temperature|speeding|offline"
        varchar message "NOT NULL"
        boolean resolved "DEFAULT false"
        timestamp created_at "DEFAULT NOW()"
        timestamp resolved_at "NULLABLE"
    }

    vehicles ||--o{ telemetry : "has (CASCADE DELETE)"
    vehicles ||--o{ alerts : "has (CASCADE DELETE)"
```

---

## Relaciones

| Relación | Cardinalidad | Comportamiento |
|----------|-------------|----------------|
| `vehicles` → `telemetry` | 1 a N | `ON DELETE CASCADE` — borrar vehículo elimina todo su historial |
| `vehicles` → `alerts` | 1 a N | `ON DELETE CASCADE` — borrar vehículo elimina todas sus alertas |
| `users` | Aislada | Sin FK hacia otras tablas. Auth por JWT; el rol viaja en el token. |

---

## Enumeraciones

```sql
-- Roles de usuario
ENUM role: 'admin' | 'user'

-- Ciudades operativas
ENUM city: 'medellin' | 'bogota' | 'cali' | 'barranquilla' | 'cartagena' | 'bucaramanga'

-- Estado del vehículo
ENUM status: 'active' | 'inactive'

-- Tipos de alerta
ENUM alert_type: 'low_fuel' | 'high_temperature' | 'speeding' | 'offline'
```

---

## Notas de implementación

- **`password_hash`** tiene `select: false` en TypeORM — nunca se retorna en queries por defecto.
- **`device_id`** se genera automáticamente al crear un vehículo (`DEV-XXXX-YYYY`). Se enmascara a `DEV-****-YYYY` para usuarios con rol `user`.
- **`telemetry.speed`**, **`fuel_level`** y **`temperature`** son nullable para tolerar dispositivos que no reportan todos los campos.
- **`alerts.resolved_at`** es nullable — se llena solo cuando `resolved = true` via `PATCH /alerts/:id/resolve`.
- No existe FK entre `users` y `vehicles`/`telemetry`/`alerts`. La autorización es stateless (JWT).
