import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VehiclesService } from '../vehicles/vehicles.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { CITIES } from './cities.config';

interface VehicleState {
  lat: number;
  lng: number;
  fuel: number;
}

@Injectable()
export class SimulationService implements OnModuleInit, OnModuleDestroy {
  private enabled: boolean;
  private intervalMs: number;
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private states = new Map<string, VehicleState>();

  constructor(
    private config: ConfigService,
    private vehiclesService: VehiclesService,
    private telemetryService: TelemetryService,
  ) {
    this.enabled = config.get<string>('SIMULATE') === 'true';
    this.intervalMs = Number(config.get('SIMULATE_INTERVAL_MS') ?? 3000);
  }

  async onModuleInit() {
    if (!this.enabled) return;
    const vehicles = await this.vehiclesService.findActiveVehicles();
    for (const v of vehicles) this.startVehicle(v);
  }

  onModuleDestroy() {
    this.timers.forEach((t) => clearInterval(t));
    this.timers.clear();
  }

  startVehicle(vehicle: Vehicle) {
    if (!this.enabled || this.timers.has(vehicle.id)) return;
    const center = CITIES[vehicle.city] ?? { lat: 0, lng: 0 };
    this.states.set(vehicle.id, {
      lat: center.lat,
      lng: center.lng,
      fuel: 100,
    });
    const timer = setInterval(() => void this.tick(vehicle), this.intervalMs);
    this.timers.set(vehicle.id, timer);
  }

  stopVehicle(vehicleId: string) {
    const timer = this.timers.get(vehicleId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(vehicleId);
      this.states.delete(vehicleId);
    }
  }

  private async tick(vehicle: Vehicle) {
    const state = this.states.get(vehicle.id);
    if (!state) return;

    state.lat += Math.random() * 0.002 - 0.001;
    state.lng += Math.random() * 0.002 - 0.001;
    state.fuel = Math.max(0, state.fuel - 0.1);

    try {
      await this.telemetryService.ingest({
        vehicle_id: vehicle.id,
        lat: state.lat,
        lng: state.lng,
        speed: 20 + Math.random() * 100,
        fuel_level: state.fuel,
        temperature: 75 + Math.random() * 20,
      });
    } catch {
      // vehicle may have been deleted
      this.stopVehicle(vehicle.id);
    }
  }
}
