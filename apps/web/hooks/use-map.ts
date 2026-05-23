'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { RefObject } from 'react'
import type { Telemetry } from '@/types/telemetry.types'
import type { UIVehicleStatus } from '@/types/fleet'

const STATUS_COLORS: Record<UIVehicleStatus, string> = {
  active: '#22c55e',
  idle: '#f59e0b',
  alert: '#ef4444',
  offline: '#6b7280',
}

function createMarkerEl(status: UIVehicleStatus): HTMLDivElement {
  const color = STATUS_COLORS[status]
  const el = document.createElement('div')
  el.style.cssText = [
    `background:${color}`,
    'width:30px', 'height:30px', 'border-radius:50%',
    'border:2.5px solid white',
    'box-shadow:0 2px 8px rgba(0,0,0,.45)',
    'cursor:pointer',
    'display:flex', 'align-items:center', 'justify-content:center',
    'transition:transform 0.15s ease,box-shadow 0.15s ease,outline 0.15s ease',
  ].join(';')
  el.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="7" width="13" height="9" rx="1.5" fill="white"/>
    <path d="M14 9.5V7h4l3 4.5V16h-7V9.5z" fill="white"/>
    <circle cx="5" cy="17.5" r="2" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="18" cy="17.5" r="2" fill="${color}" stroke="white" stroke-width="1.5"/>
    <rect x="15" y="8.5" width="3.5" height="2.5" rx="0.5" fill="${color}" opacity="0.6"/>
  </svg>`
  return el
}

export function useMap(containerRef: RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: maplibregl.Map

    import('maplibre-gl').then((maplibregl) => {
      if (!containerRef.current) return

      map = new maplibregl.Map({
        container: containerRef.current,
        style: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://demotiles.maplibre.org/style.json',
        center: [-74.0721, 4.711],
        zoom: 11,
      })

      map.on('load', () => {
        mapRef.current = map
        setIsReady(true)
      })
    })

    return () => {
      if (map) {
        map.remove()
        mapRef.current = null
        markersRef.current.clear()
        setIsReady(false)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addVehicleMarker = useCallback(
    async (vehicleId: string, telemetry: Telemetry, status: UIVehicleStatus) => {
      const map = mapRef.current
      if (!map) return

      const maplibregl = await import('maplibre-gl')
      const el = createMarkerEl(status)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([telemetry.lng, telemetry.lat])
        .addTo(map)

      markersRef.current.set(vehicleId, marker)
    },
    []
  )

  const updateVehicleMarker = useCallback(
    async (vehicleId: string, telemetry: Telemetry, status: UIVehicleStatus) => {
      const existing = markersRef.current.get(vehicleId)
      if (!existing) {
        await addVehicleMarker(vehicleId, telemetry, status)
        return
      }
      existing.setLngLat([telemetry.lng, telemetry.lat])
      const el = existing.getElement()
      el.style.background = STATUS_COLORS[status]
    },
    [addVehicleMarker]
  )

  const flyToVehicle = useCallback((lng: number, lat: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 14, duration: 800 })
  }, [])

  const setSelectedMarker = useCallback((vehicleId: string | null) => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      if (id === vehicleId) {
        el.style.outline = '2.5px solid #d4ff3d'
        el.style.outlineOffset = '2px'
        el.style.transform = 'scale(1.15)'
        el.style.zIndex = '10'
      } else {
        el.style.outline = 'none'
        el.style.outlineOffset = '0'
        el.style.transform = 'scale(1)'
        el.style.zIndex = ''
      }
    })
  }, [])

  return { map: mapRef.current, isReady, addVehicleMarker, updateVehicleMarker, flyToVehicle, setSelectedMarker }
}
