'use client'

import { useState, useEffect } from 'react'
import { getHistory } from '@/lib/api/telemetry.api'
import type { Telemetry, TelemetryPage } from '@/types/telemetry.types'

interface UseTelemetryHistoryResult extends Omit<TelemetryPage, 'data'> {
  data: Telemetry[]
  isLoading: boolean
  error: string | null
}

export function useTelemetryHistory(
  vehicleId: string,
  params?: { page?: number; limit?: number }
): UseTelemetryHistoryResult {
  const [state, setState] = useState<UseTelemetryHistoryResult>({
    data: [],
    total: 0,
    page: 1,
    limit: 50,
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    if (!vehicleId) return
    let cancelled = false

    setState((s) => ({ ...s, isLoading: true, error: null }))

    getHistory(vehicleId, params)
      .then((result) => {
        if (!cancelled) {
          setState({
            data: result.data.slice().reverse(),
            total: result.total,
            page: result.page,
            limit: result.limit,
            isLoading: false,
            error: null,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, isLoading: false, error: 'Error cargando historial' }))
      })

    return () => {
      cancelled = true
    }
  }, [vehicleId, params?.page, params?.limit]) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
