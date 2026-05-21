import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertType } from './entities/alert.entity';
import { AlertsGateway } from './alerts.gateway';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert) private alerts: Repository<Alert>,
    private alertsGateway: AlertsGateway,
  ) {}

  async findAll(filters: {
    resolved?: string;
    type?: string;
  }): Promise<object[]> {
    const qb = this.alerts
      .createQueryBuilder('a')
      .leftJoin('a.vehicle', 'v')
      .addSelect('v.name', 'vehicle_name')
      .orderBy('a.created_at', 'DESC');

    if (filters.resolved !== undefined) {
      qb.andWhere('a.resolved = :resolved', {
        resolved: filters.resolved === 'true',
      });
    }
    if (filters.type) {
      qb.andWhere('a.type = :type', { type: filters.type });
    }

    const rows = await qb.getRawAndEntities();
    return rows.entities.map((a, i) => ({
      id: a.id,
      vehicle_id: a.vehicle_id,
      vehicle_name:
        (rows.raw[i] as Record<string, unknown> | undefined)?.[
          'vehicle_name'
        ] ?? null,
      type: a.type,
      message: a.message,
      resolved: a.resolved,
      created_at: a.created_at,
    }));
  }

  async findByVehicle(vehicleId: string): Promise<Alert[]> {
    return this.alerts.find({
      where: { vehicle_id: vehicleId },
      order: { created_at: 'DESC' },
    });
  }

  async resolve(id: string): Promise<object> {
    const alert = await this.alerts.findOneBy({ id });
    if (!alert) throw new NotFoundException('Alert not found');
    if (alert.resolved) throw new BadRequestException('Alert already resolved');
    alert.resolved = true;
    alert.resolved_at = new Date();
    await this.alerts.save(alert);
    return { id: alert.id, resolved: true, resolved_at: alert.resolved_at };
  }

  async createAlert(
    vehicleId: string,
    vehicleName: string,
    type: AlertType,
    message: string,
  ): Promise<Alert> {
    const alert = this.alerts.create({ vehicle_id: vehicleId, type, message });
    await this.alerts.save(alert);
    this.alertsGateway.emitAlert({
      alertId: alert.id,
      vehicleId: alert.vehicle_id,
      vehicleName,
      type: alert.type,
      message: alert.message,
      created_at: alert.created_at,
    });
    return alert;
  }

  async findUnresolvedLowFuel(vehicleId: string): Promise<Alert | null> {
    return this.alerts.findOne({
      where: { vehicle_id: vehicleId, type: 'low_fuel', resolved: false },
    });
  }
}
