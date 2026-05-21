import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';
import { maskDeviceId } from '../common/mask-device-id';
import { Telemetry } from '../telemetry/entities/telemetry.entity';

function generateDeviceId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const rand = (n: number) =>
    Array.from(
      { length: n },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
  return `DEV-${rand(4)}-${rand(4)}`;
}

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private vehicles: Repository<Vehicle>,
    @InjectRepository(Telemetry) private telemetry: Repository<Telemetry>,
  ) {}

  async findAll(role: string): Promise<object[]> {
    const list = await this.vehicles.find({ order: { created_at: 'DESC' } });
    return list.map((v) => ({
      ...v,
      device_id: maskDeviceId(v.device_id, role),
    }));
  }

  async findOne(id: string, role: string): Promise<object> {
    const vehicle = await this.vehicles.findOneBy({ id });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    const latest = await this.telemetry.findOne({
      where: { vehicle_id: id },
      order: { timestamp: 'DESC' },
    });
    return {
      ...vehicle,
      device_id: maskDeviceId(vehicle.device_id, role),
      latest_telemetry: latest
        ? {
            lat: Number(latest.lat),
            lng: Number(latest.lng),
            speed: latest.speed !== null ? Number(latest.speed) : null,
            fuel_level:
              latest.fuel_level !== null ? Number(latest.fuel_level) : null,
            temperature:
              latest.temperature !== null ? Number(latest.temperature) : null,
            timestamp: latest.timestamp,
          }
        : null,
    };
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    let device_id: string;
    do {
      device_id = generateDeviceId();
    } while (await this.vehicles.findOneBy({ device_id }));
    const vehicle = this.vehicles.create({
      name: dto.name,
      city: dto.city as Vehicle['city'],
      device_id,
    });
    return this.vehicles.save(vehicle);
  }

  async update(
    id: string,
    dto: UpdateVehicleDto,
    role: string,
  ): Promise<object> {
    const vehicle = await this.vehicles.findOneBy({ id });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (dto.name !== undefined) vehicle.name = dto.name;
    if (dto.city !== undefined) vehicle.city = dto.city as Vehicle['city'];
    if (dto.status !== undefined)
      vehicle.status = dto.status as Vehicle['status'];
    await this.vehicles.save(vehicle);
    return { ...vehicle, device_id: maskDeviceId(vehicle.device_id, role) };
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.vehicles.findOneBy({ id });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    await this.vehicles.remove(vehicle);
  }

  async findActiveVehicles(): Promise<Vehicle[]> {
    return this.vehicles.findBy({ status: 'active' });
  }
}
