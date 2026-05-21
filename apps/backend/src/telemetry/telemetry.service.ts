import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Telemetry } from './entities/telemetry.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { AlertsService } from '../alerts/alerts.service';
import { TelemetryGateway } from './telemetry.gateway';
import { CreateTelemetryDto } from './dto';

@Injectable()
export class TelemetryService {
  constructor(
    @InjectRepository(Telemetry) private telemetry: Repository<Telemetry>,
    @InjectRepository(Vehicle) private vehicles: Repository<Vehicle>,
    private alertsService: AlertsService,
    private gateway: TelemetryGateway,
  ) {}

  async ingest(dto: CreateTelemetryDto): Promise<object> {
    const vehicle = await this.vehicles.findOneBy({ id: dto.vehicle_id });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const row = this.telemetry.create({
      vehicle_id: dto.vehicle_id,
      lat: dto.lat,
      lng: dto.lng,
      speed: dto.speed ?? null,
      fuel_level: dto.fuel_level ?? null,
      temperature: dto.temperature ?? null,
      timestamp: new Date(),
    });
    await this.telemetry.save(row);

    const alert_generated = await this.evaluateFuel(vehicle, row);

    this.gateway.emitLocation({
      vehicleId: vehicle.id,
      deviceId: vehicle.device_id,
      lat: Number(row.lat),
      lng: Number(row.lng),
      speed: row.speed !== null ? Number(row.speed) : null,
      fuel_level: row.fuel_level !== null ? Number(row.fuel_level) : null,
      temperature: row.temperature !== null ? Number(row.temperature) : null,
      timestamp: row.timestamp,
    });

    return {
      id: row.id,
      vehicle_id: row.vehicle_id,
      lat: Number(row.lat),
      lng: Number(row.lng),
      speed: row.speed !== null ? Number(row.speed) : null,
      fuel_level: row.fuel_level !== null ? Number(row.fuel_level) : null,
      temperature: row.temperature !== null ? Number(row.temperature) : null,
      timestamp: row.timestamp,
      alert_generated,
    };
  }

  private async evaluateFuel(
    vehicle: Vehicle,
    current: Telemetry,
  ): Promise<boolean> {
    if (current.fuel_level === null) return false;

    const recent = await this.telemetry.find({
      where: { vehicle_id: vehicle.id },
      order: { timestamp: 'DESC' },
      take: 6,
    });

    if (recent.length < 2) return false;

    let totalDrop = 0;
    let totalHours = 0;
    for (let i = 0; i < recent.length - 1; i++) {
      const curr = recent[i];
      const prev = recent[i + 1];
      if (curr.fuel_level === null || prev.fuel_level === null) continue;
      const drop = Number(prev.fuel_level) - Number(curr.fuel_level);
      const diffMs =
        new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
      if (diffMs <= 0) continue;
      totalDrop += drop;
      totalHours += diffMs / 3_600_000;
    }

    if (totalHours === 0 || totalDrop <= 0) return false;

    const consumptionPerHour = totalDrop / totalHours;
    const autonomyHours = Number(current.fuel_level) / consumptionPerHour;

    if (autonomyHours >= 1) return false;

    const existing = await this.alertsService.findUnresolvedLowFuel(vehicle.id);
    if (existing) return false;

    const minutes = Math.round(autonomyHours * 60);
    await this.alertsService.createAlert(
      vehicle.id,
      vehicle.name,
      'low_fuel',
      `Combustible bajo: autonomía estimada de ${minutes} minutos`,
    );
    return true;
  }

  async findByVehicle(
    vehicleId: string,
    page = 1,
    limit = 50,
    from?: string,
    to?: string,
  ): Promise<object> {
    const vehicle = await this.vehicles.findOneBy({ id: vehicleId });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const qb = this.telemetry
      .createQueryBuilder('t')
      .where('t.vehicle_id = :vehicleId', { vehicleId })
      .orderBy('t.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (from) qb.andWhere('t.timestamp >= :from', { from: new Date(from) });
    if (to) qb.andWhere('t.timestamp <= :to', { to: new Date(to) });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findLatest(vehicleId: string): Promise<object> {
    const vehicle = await this.vehicles.findOneBy({ id: vehicleId });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const row = await this.telemetry.findOne({
      where: { vehicle_id: vehicleId },
      order: { timestamp: 'DESC' },
    });
    if (!row) throw new NotFoundException('No telemetry found');
    return {
      lat: Number(row.lat),
      lng: Number(row.lng),
      speed: row.speed !== null ? Number(row.speed) : null,
      fuel_level: row.fuel_level !== null ? Number(row.fuel_level) : null,
      temperature: row.temperature !== null ? Number(row.temperature) : null,
      timestamp: row.timestamp,
    };
  }
}
