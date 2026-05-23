import { View, Text, StyleSheet } from 'react-native'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { useVehicles } from '../../hooks/use-vehicles'
import { VehicleMarker } from '../../components/atoms/VehicleMarker'
import { deriveUiStatus } from '@simon/types'
import { colors, fontSize, fontWeight, spacing } from '../../theme'

MapLibreGL.setAccessToken(null)

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export default function MapScreen() {
  const { vehicles, isLoading } = useVehicles()

  const vehiclesWithLocation = vehicles.filter((v) => v.latest_telemetry)

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView style={styles.map} mapStyle={MAP_STYLE} logoEnabled={false}>
        <MapLibreGL.Camera
          defaultSettings={{
            centerCoordinate: [-74.0721, 4.711],
            zoomLevel: 11,
          }}
        />

        {vehiclesWithLocation.map((vehicle) => {
          const telemetry = vehicle.latest_telemetry!
          const status = deriveUiStatus(vehicle, [])

          return (
            <MapLibreGL.MarkerView
              key={vehicle.id}
              coordinate={[telemetry.lng, telemetry.lat]}
            >
              <VehicleMarker status={status} />
            </MapLibreGL.MarkerView>
          )
        })}
      </MapLibreGL.MapView>

      {isLoading && (
        <View style={styles.loadingBadge}>
          <Text style={styles.loadingText}>Loading fleet…</Text>
        </View>
      )}

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>
          {vehiclesWithLocation.length} / {vehicles.length} active
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  map: {
    flex: 1,
  },
  loadingBadge: {
    position: 'absolute',
    top: spacing.xl,
    alignSelf: 'center',
    backgroundColor: colors.surface1,
    borderRadius: 9999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  loadingText: {
    color: colors.foregroundMuted,
    fontSize: fontSize.sm,
    fontFamily: 'Geist',
  },
  legend: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    backgroundColor: colors.surface1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  legendTitle: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: 'Geist-Medium',
  },
})
