'use client'

import { useState } from 'react'
import { useAlertsStore } from '@/stores/alerts.store'
import { resolveAlert as apiResolveAlert } from '@/lib/api/alerts.api'
import { AlertRow } from '@/components/molecules/AlertRow'
import type { AlertType } from '@/types/alert.types'

type FilterStatus = 'all' | 'active' | 'resolved'

export default function AlertsPage() {
  const alerts = useAlertsStore((s) => s.alerts)
  const resolveInStore = useAlertsStore((s) => s.resolveAlert)
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active')

  const filtered = alerts.filter((a) => {
    const typeMatch = typeFilter === 'all' || a.type === typeFilter
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !a.resolved) ||
      (statusFilter === 'resolved' && a.resolved)
    return typeMatch && statusMatch
  })

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  async function handleResolve(id: string) {
    const result = await apiResolveAlert(id)
    resolveInStore(id, result.resolved_at)
  }

  const alertTypes: (AlertType | 'all')[] = ['all', 'low_fuel', 'high_temperature', 'speeding', 'offline']
  const typeLabels: Record<AlertType | 'all', string> = {
    all: 'Todas',
    low_fuel: 'Combustible',
    high_temperature: 'Temperatura',
    speeding: 'Velocidad',
    offline: 'Sin señal',
  }

  return (
    <div className="p-6 overflow-auto min-h-0 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Alertas</h1>
        <p className="text-sm text-foreground-muted mt-0.5">
          {alerts.filter((a) => !a.resolved).length} activas · {alerts.length} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'active', 'resolved'] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              statusFilter === s
                ? 'bg-accent text-white border-accent'
                : 'bg-surface-1 text-foreground-muted border-hairline hover:border-hairline-strong'
            }`}
          >
            {s === 'all' ? 'Todas' : s === 'active' ? 'Activas' : 'Resueltas'}
          </button>
        ))}
        <span className="text-hairline">|</span>
        {alertTypes.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              typeFilter === t
                ? 'bg-accent text-white border-accent'
                : 'bg-surface-1 text-foreground-muted border-hairline hover:border-hairline-strong'
            }`}
          >
            {typeLabels[t]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <div className="text-center py-12 text-foreground-muted text-sm border border-hairline rounded-xl">
            Sin alertas para los filtros seleccionados
          </div>
        ) : (
          sorted.map((a) => (
            <AlertRow key={a.id} alert={a} onResolve={!a.resolved ? handleResolve : undefined} />
          ))
        )}
      </div>
    </div>
  )
}
