'use client'

import { use } from 'react'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { useAlertsStore } from '@/stores/alerts.store'
import { useAuthStore } from '@/stores/auth.store'
import { useTelemetryHistory } from '@/hooks/use-telemetry-history'
import { deriveUiStatus } from '@/types/fleet'
import { VehicleStatusBadge } from '@/components/atoms/VehicleStatusBadge'
import { AlertRow } from '@/components/molecules/AlertRow'
import { resolveAlert } from '@/lib/api/alerts.api'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const vehicles = useVehiclesStore((s) => s.vehicles)
  const allAlerts = useAlertsStore((s) => s.alerts)
  const resolveInStore = useAlertsStore((s) => s.resolveAlert)
  const role = useAuthStore((s) => s.user?.role)

  const vehicle = vehicles.find((v) => v.id === id)
  const vehicleAlerts = allAlerts.filter((a) => a.vehicle_id === id)
  const uiStatus = vehicle ? deriveUiStatus(vehicle, vehicleAlerts) : 'offline'
  const { data, isLoading } = useTelemetryHistory(id, { limit: 50 })

  const chartData = data.map((t) => ({
    time: new Date(t.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    speed: Math.round(t.speed),
    fuel: Math.round(t.fuel_level),
  }))

  async function handleResolve(alertId: string) {
    const result = await resolveAlert(alertId)
    resolveInStore(alertId, result.resolved_at)
  }

  if (!vehicle) {
    return (
      <div className="p-6 text-foreground-muted">
        Vehículo no encontrado. <a href="/vehicles" className="text-accent">← Volver</a>
      </div>
    )
  }

  const t = vehicle.latest_telemetry

  return (
    <div className="p-6 overflow-auto min-h-0 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{vehicle.name}</h1>
            <VehicleStatusBadge status={uiStatus} />
          </div>
          <p className="text-sm text-foreground-muted mt-1 font-mono">{vehicle.device_id} · {vehicle.city}</p>
        </div>
        <a href="/vehicles" className="text-sm text-foreground-muted hover:text-foreground">← Vehículos</a>
      </div>

      {/* Metric cards */}
      {t && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Velocidad', value: `${Math.round(t.speed)} km/h` },
            { label: 'Combustible', value: `${Math.round(t.fuel_level)}%` },
            { label: 'Temperatura', value: `${Math.round(t.temperature)}°C` },
            { label: 'Posición', value: `${t.lat.toFixed(4)}, ${t.lng.toFixed(4)}` },
          ].map((m) => (
            <div key={m.label} className="p-4 border border-hairline rounded-xl bg-surface-1">
              <div className="text-xs text-foreground-muted mb-1">{m.label}</div>
              <div className="text-lg font-semibold font-mono">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Speed chart */}
      <div className="border border-hairline rounded-xl bg-surface-1 p-4">
        <h3 className="text-sm font-semibold mb-4">Velocidad histórica (km/h)</h3>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-foreground-muted text-sm">Cargando…</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--foreground-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--foreground-muted)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', fontSize: 11 }}
              />
              <Line type="monotone" dataKey="speed" stroke="var(--accent)" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Fuel chart */}
      <div className="border border-hairline rounded-xl bg-surface-1 p-4">
        <h3 className="text-sm font-semibold mb-4">Nivel de combustible (%)</h3>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-foreground-muted text-sm">Cargando…</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--foreground-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--foreground-muted)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="fuel"
                stroke="var(--accent)"
                fill="url(#fuelGrad)"
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Alerts timeline — admin only */}
      {role === 'admin' && (
        <div className="border border-hairline rounded-xl bg-surface-1 p-4">
          <h3 className="text-sm font-semibold mb-4">Timeline de alertas</h3>
          <div className="flex flex-col gap-2">
            {vehicleAlerts.length === 0 ? (
              <p className="text-sm text-foreground-muted">Sin alertas para este vehículo</p>
            ) : (
              vehicleAlerts.map((a) => (
                <AlertRow key={a.id} alert={a} onResolve={handleResolve} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
