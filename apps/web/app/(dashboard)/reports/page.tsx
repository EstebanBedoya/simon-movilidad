'use client'

import { useMemo } from 'react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { BarChart2, Car, AlertTriangle, CheckCircle } from 'lucide-react'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { useAlertsStore } from '@/stores/alerts.store'
import type { City } from '@/types/vehicle.types'
import type { AlertType } from '@/types/alert.types'

const C = {
  accent:   '#d4ff3d',
  success:  '#2bd67b',
  danger:   '#ff4d5e',
  surface3: '#1a1a1d',
  hairline: 'rgba(255,255,255,0.06)',
  fgMuted:  'rgba(245,245,245,0.55)',
  fgDim:    'rgba(245,245,245,0.35)',
}

const CITY_LABELS: Record<City, string> = {
  medellin:    'Medellín',
  bogota:      'Bogotá',
  cali:        'Cali',
  barranquilla:'Barranquilla',
  cartagena:   'Cartagena',
  bucaramanga: 'Bucaramanga',
}

const ALERT_LABELS: Record<AlertType, string> = {
  low_fuel:         'Combustible',
  high_temperature: 'Temperatura',
  speeding:         'Velocidad',
  offline:          'Sin señal',
}

type TooltipEntry = { name: string; value: number; color?: string; fill?: string }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-hairline rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-foreground-muted mb-1.5">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: p.color ?? p.fill }} />
          <span style={{ color: p.color ?? p.fill }}>{p.name}:</span>
          <span className="text-foreground font-mono">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string
  value: number
  sub?: string
  icon: React.ElementType
  color?: string
}) {
  return (
    <div className="bg-bg border border-hairline rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-foreground-muted font-semibold tracking-[0.1em] uppercase">{label}</span>
        <Icon size={13} className="text-foreground-dim" />
      </div>
      <div>
        <span className="text-3xl font-semibold tracking-tight" style={color ? { color } : {}}>
          {value}
        </span>
        {sub && <p className="text-xs text-foreground-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const vehicles = useVehiclesStore((s) => s.vehicles)
  const alerts   = useAlertsStore((s) => s.alerts)

  const stats = useMemo(() => {
    const active        = vehicles.filter((v) => v.status === 'active').length
    const inactive      = vehicles.filter((v) => v.status === 'inactive').length
    const activeAlerts  = alerts.filter((a) => !a.resolved).length
    const resolvedAlerts = alerts.filter((a) => a.resolved).length
    return { active, inactive, activeAlerts, resolvedAlerts }
  }, [vehicles, alerts])

  const fleetDonut = useMemo(() => [
    { name: 'Activos',   value: stats.active,   color: C.success  },
    { name: 'Inactivos', value: stats.inactive,  color: C.surface3 },
  ], [stats])

  const cityBars = useMemo(() => {
    const counts: Partial<Record<City, number>> = {}
    for (const v of vehicles) counts[v.city] = (counts[v.city] ?? 0) + 1
    return (Object.entries(counts) as [City, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([city, count]) => ({ city: CITY_LABELS[city], count }))
  }, [vehicles])

  const alertBars = useMemo(() => {
    const counts: Partial<Record<AlertType, { active: number; resolved: number }>> = {}
    for (const a of alerts) {
      if (!counts[a.type]) counts[a.type] = { active: 0, resolved: 0 }
      if (a.resolved) counts[a.type]!.resolved++
      else            counts[a.type]!.active++
    }
    return (Object.entries(counts) as [AlertType, { active: number; resolved: number }][])
      .map(([type, c]) => ({ type: ALERT_LABELS[type], ...c }))
  }, [alerts])

  const pct = vehicles.length > 0 ? Math.round((stats.active / vehicles.length) * 100) : 0

  return (
    <div className="p-6 overflow-auto min-h-0 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <BarChart2 size={18} className="text-foreground-muted" />
        <div>
          <h1 className="text-xl font-semibold">Reportes</h1>
          <p className="text-sm text-foreground-muted mt-0.5">Resumen operativo de la flota</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Vehículos activos"  value={stats.active}        sub={`de ${vehicles.length} total`} icon={Car}           color={C.success} />
        <StatCard label="Inactivos"           value={stats.inactive}                                          icon={Car}                              />
        <StatCard label="Alertas activas"     value={stats.activeAlerts}                                      icon={AlertTriangle} color={stats.activeAlerts > 0 ? C.danger : undefined} />
        <StatCard label="Alertas resueltas"   value={stats.resolvedAlerts}                                    icon={CheckCircle}   color={C.success} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Donut — fleet health */}
        <div className="bg-bg border border-hairline rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Salud de la flota</h2>
          <div className="relative flex items-center justify-center" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fleetDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  strokeWidth={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {fleetDonut.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-[32px] font-semibold tracking-tight leading-none" style={{ color: C.success }}>{pct}%</span>
              <span className="text-xs text-foreground-muted mt-1">operativos</span>
            </div>
          </div>
          <div className="flex gap-5 justify-center text-xs text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: C.success }} />
              Activos ({stats.active})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: C.surface3, border: '1px solid rgba(255,255,255,0.1)' }} />
              Inactivos ({stats.inactive})
            </span>
          </div>
        </div>

        {/* Horizontal bar — by city */}
        <div className="bg-bg border border-hairline rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Vehículos por ciudad</h2>
          {cityBars.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-foreground-muted py-16">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cityBars} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke={C.hairline} />
                <XAxis
                  type="number"
                  tick={{ fill: C.fgDim, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="city"
                  tick={{ fill: C.fgMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Vehículos" fill={C.accent} radius={[0, 3, 3, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grouped bar — alerts by type */}
      <div className="bg-bg border border-hairline rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold">Alertas por tipo</h2>
        {alertBars.length === 0 ? (
          <div className="flex items-center justify-center text-xs text-foreground-muted py-10">Sin alertas registradas</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={alertBars} margin={{ left: 0, right: 16, top: 4, bottom: 4 }} barGap={4}>
              <CartesianGrid vertical={false} stroke={C.hairline} />
              <XAxis
                dataKey="type"
                tick={{ fill: C.fgMuted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: C.fgDim, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="active"   name="Activas"   fill={C.danger}  radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Bar dataKey="resolved" name="Resueltas" fill={C.success} radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex gap-5 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: C.danger }}  />Activas</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: C.success }} />Resueltas</span>
        </div>
      </div>
    </div>
  )
}
