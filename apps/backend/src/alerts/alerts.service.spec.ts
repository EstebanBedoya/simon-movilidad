import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AlertsService } from './alerts.service';
import { Alert } from './entities/alert.entity';
import { AlertsGateway } from './alerts.gateway';

const alertFactory = (overrides?: Partial<Alert>): Alert =>
  ({
    id: 'alert-uuid-1',
    vehicle_id: 'v-uuid-1',
    vehicle: undefined,
    type: 'low_fuel',
    message: 'Fuel low',
    resolved: false,
    created_at: new Date('2024-01-01'),
    resolved_at: null,
    ...overrides,
  }) as Alert;

const mockAlertRepo = () =>
  ({
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  }) as unknown as Repository<Alert>;

const mockGateway = {
  emitAlert: jest.fn(),
};

describe('AlertsService', () => {
  let service: AlertsService;
  let alertRepo: ReturnType<typeof mockAlertRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: getRepositoryToken(Alert), useFactory: mockAlertRepo },
        { provide: AlertsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
    alertRepo = module.get(getRepositoryToken(Alert));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    const buildQB = (alerts: Alert[] = [], raw: unknown[] = []) => ({
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn().mockResolvedValue({ entities: alerts, raw }),
    });

    it('should return all alerts without filters', async () => {
      const alerts = [alertFactory()];
      (alertRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        buildQB(alerts, [{ vehicle_name: 'Bus 01' }]),
      );

      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect((result[0] as Record<string, unknown>)['vehicle_name']).toBe(
        'Bus 01',
      );
    });

    it('should add resolved filter when provided', async () => {
      const qb = buildQB([alertFactory({ resolved: false })], [{}]);
      (alertRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ resolved: 'false' });

      expect(qb.andWhere).toHaveBeenCalledWith('a.resolved = :resolved', {
        resolved: false,
      });
    });

    it('should add type filter when provided', async () => {
      const qb = buildQB([alertFactory()], [{}]);
      (alertRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findAll({ type: 'low_fuel' });

      expect(qb.andWhere).toHaveBeenCalledWith('a.type = :type', {
        type: 'low_fuel',
      });
    });

    it('should handle null vehicle_name gracefully', async () => {
      const alerts = [alertFactory()];
      (alertRepo.createQueryBuilder as jest.Mock).mockReturnValue(
        buildQB(alerts, [undefined]),
      );

      const result = await service.findAll({});
      expect((result[0] as Record<string, unknown>)['vehicle_name']).toBeNull();
    });
  });

  describe('findByVehicle', () => {
    it('should return alerts for the specified vehicle', async () => {
      const alerts = [alertFactory(), alertFactory({ id: 'alert-2' })];
      (alertRepo.find as jest.Mock).mockResolvedValue(alerts);

      const result = await service.findByVehicle('v-uuid-1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(alertRepo.find as jest.Mock).toHaveBeenCalledWith({
        where: { vehicle_id: 'v-uuid-1' },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(alerts);
    });

    it('should return empty array when vehicle has no alerts', async () => {
      (alertRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.findByVehicle('v-uuid-99');
      expect(result).toEqual([]);
    });
  });

  describe('resolve', () => {
    it('should set resolved=true and resolved_at on an unresolved alert', async () => {
      const alert = alertFactory({ resolved: false });
      (alertRepo.findOneBy as jest.Mock).mockResolvedValue(alert);
      (alertRepo.save as jest.Mock).mockResolvedValue({
        ...alert,
        resolved: true,
      });

      const result = (await service.resolve('alert-uuid-1')) as Record<
        string,
        unknown
      >;

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(alertRepo.save as jest.Mock).toHaveBeenCalled();
      expect(result['resolved']).toBe(true);
      expect(result['resolved_at']).toBeDefined();
    });

    it('should throw BadRequestException when alert is already resolved', async () => {
      (alertRepo.findOneBy as jest.Mock).mockResolvedValue(
        alertFactory({ resolved: true }),
      );

      await expect(service.resolve('alert-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when alert does not exist', async () => {
      (alertRepo.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.resolve('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createAlert', () => {
    it('should create, save and emit the alert', async () => {
      const alert = alertFactory();
      (alertRepo.create as jest.Mock).mockReturnValue(alert);
      (alertRepo.save as jest.Mock).mockResolvedValue(alert);

      const result = await service.createAlert(
        'v-uuid-1',
        'Bus 01',
        'low_fuel',
        'Fuel is low',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(alertRepo.save as jest.Mock).toHaveBeenCalledWith(alert);
      expect(mockGateway.emitAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleId: alert.vehicle_id,
          type: alert.type,
        }),
      );
      expect(result).toEqual(alert);
    });
  });

  describe('findUnresolvedLowFuel', () => {
    it('should return an existing unresolved low_fuel alert', async () => {
      const alert = alertFactory({ resolved: false, type: 'low_fuel' });
      (alertRepo.findOne as jest.Mock).mockResolvedValue(alert);

      const result = await service.findUnresolvedLowFuel('v-uuid-1');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(alertRepo.findOne as jest.Mock).toHaveBeenCalledWith({
        where: { vehicle_id: 'v-uuid-1', type: 'low_fuel', resolved: false },
      });
      expect(result).toEqual(alert);
    });

    it('should return null when no unresolved low_fuel alert exists', async () => {
      (alertRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.findUnresolvedLowFuel('v-uuid-99');
      expect(result).toBeNull();
    });
  });
});
