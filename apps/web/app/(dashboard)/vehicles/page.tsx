'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useVehiclesStore } from '@/stores/vehicles.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAlertsStore } from '@/stores/alerts.store'
import { deriveUiStatus } from '@/types/fleet'
import { VehicleStatusBadge } from '@/components/atoms/VehicleStatusBadge'
import { deleteVehicle, createVehicle } from '@/lib/api/vehicles.api'
import { getVehicles } from '@/lib/api/vehicles.api'

export default function VehiclesPage() {
  const router = useRouter()
  const vehicles = useVehiclesStore((s) => s.vehicles)
  const setVehicles = useVehiclesStore((s) => s.setVehicles)
  const role = useAuthStore((s) => s.user?.role)
  const alerts = useAlertsStore((s) => s.alerts)

  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createCity, setCreateCity] = useState('bogota')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    setCreating(true)
    try {
      await createVehicle({ name: createName, city: createCity })
      const fresh = await getVehicles()
      setVehicles(fresh)
      setShowCreate(false)
      setCreateName('')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este vehículo y su historial?')) return
    await deleteVehicle(id)
    const fresh = await getVehicles()
    setVehicles(fresh)
  }

  return (
    <div className="p-6 min-h-0 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Vehículos</h1>
          <p className="text-sm text-foreground-muted mt-0.5">{vehicles.length} en total</p>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium"
          >
            <Plus size={14} /> Nuevo vehículo
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-4 p-4 border border-hairline rounded-xl bg-surface-1 flex gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground-muted">Nombre</label>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="px-3 py-2 border border-hairline rounded-lg bg-bg text-sm"
              placeholder="Camión 01"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-foreground-muted">Ciudad</label>
            <select
              value={createCity}
              onChange={(e) => setCreateCity(e.target.value)}
              className="px-3 py-2 border border-hairline rounded-lg bg-bg text-sm"
            >
              {['bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'bucaramanga'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={!createName || creating}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm disabled:opacity-50"
          >
            {creating ? 'Creando…' : 'Crear'}
          </button>
          <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-foreground-muted">
            Cancelar
          </button>
        </div>
      )}

      <div className="rounded-xl border border-hairline overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline bg-surface-1">
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted">Dispositivo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted">Ciudad</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-muted">Estado</th>
              {role === 'admin' && (
                <th className="text-right px-4 py-3 text-xs font-semibold text-foreground-muted">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => {
              const vehicleAlerts = alerts.filter((a) => a.vehicle_id === v.id)
              const uiStatus = deriveUiStatus(v, vehicleAlerts)
              return (
                <tr
                  key={v.id}
                  className="border-b border-hairline last:border-0 hover:bg-surface-1 cursor-pointer"
                  onClick={() => router.push(`/vehicles/${v.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-foreground-muted">{v.device_id}</td>
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-foreground-muted capitalize">{v.city}</td>
                  <td className="px-4 py-3">
                    <VehicleStatusBadge status={uiStatus} />
                  </td>
                  {role === 'admin' && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/vehicles/${v.id}`)}
                          className="p-1.5 rounded hover:bg-surface-2 text-foreground-muted"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-1.5 rounded hover:bg-danger/10 text-foreground-muted hover:text-danger"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
        {vehicles.length === 0 && (
          <div className="text-center py-12 text-foreground-muted text-sm">Sin vehículos</div>
        )}
      </div>
    </div>
  )
}
