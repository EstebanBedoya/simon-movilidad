import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TelemetryService } from './telemetry.service';
import { Telemetry } from './entities/telemetry.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { AlertsService } from '../alerts/alerts.service';
import { TelemetryGateway } from './telemetry.gateway';

const vehicleFactory = (overrides?: Partial<Vehicle>): Vehicle => ({
  id: 'v-uuid-1',
  device_id: 'DEV-A1B2-XC54',
  name: 'Bus 01',
  city: 'medellin',
  status: 'active',
  created_at: new Date('2024-01-01'),
  telemetry: [],
  alerts: [],
  ...overrides,
});

const telemetryFactory = (overrides?: Partial<Telemetry>): Telemetry => ({
  id: 'tel-uuid-1',
  vehicle_id: 'v-uuid-1',
  lat: 6.2442,
  lng: -75.5812,
  speed: 60,
  fuel_level: 80,
  temperature: 90,
  timestamp: new Date('2024-01-01T10:00:00Z'),
  vehicle: vehicleFactory(),
  ...overrides,
});

const mockTelemetryRepo = () =>
  ({
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  }) as unknown as Repository<Telemetry>;

const mockVehicleRepo = () =>
  ({
    findOneBy: jest.fn(),
  }) as unknown as Repository<Vehicle>;

const mockAlertsService = {
  findUnresolvedLowFuel: jest.fn(),
  createAlert: jest.fn(),
};

const mockGateway = {
  emitLocation: jest.fn(),
};

describe('TelemetryService', () => {
  let service: TelemetryService;
  let telemetryRepo: ReturnType<typeof mockTelemetryRepo>;
  let vehicleRepo: ReturnType<typeof mockVehicleRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: getRepositoryToken(Telemetry),
          useFactory: mockTelemetryRepo,
        },
        { provide: getRepositoryToken(Vehicle), useFactory: mockVehicleRepo },
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: TelemetryGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
    telemetryRepo = module.get(getRepositoryToken(Telemetry));
    vehicleRepo = module.get(getRepositoryToken(Vehicle));
  });

  afterEach(() => jest.clearAllMocks());

  describe('ingest', () => {
    const dto = {
      vehicle_id: 'v-uuid-1',
      lat: 6.2442,
      lng: -75.5812,
      speed: 60,
      fuel_level: 80,
      temperature: 90,
    };

    it('should save telemetry, emit via gateway, and return alert_generated:false when fuel is ok', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);
      const savedRow = telemetryFactory();
      (telemetryRepo.create as jest.Mock).mockReturnValue(savedRow);
      (telemetryRepo.save as jest.Mock).mockResolvedValue(savedRow);
      // Only 1 reading — not enough to evaluate fuel
      (telemetryRepo.find as jest.Mock).mockResolvedValue([savedRow]);

      const result = (await service.ingest(dto)) as Record<string, unknown>;

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(telemetryRepo.save as jest.Mock).toHaveBeenCalled();
      expect(mockGateway.emitLocation).toHaveBeenCalled();
      expect(result['alert_generated']).toBe(false);
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(service.ingest(dto)).rejects.toThrow(NotFoundException);
    });

    it('should return alert_generated:true when low fuel alert is triggered', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);

      const baseTime = new Date('2024-01-01T10:00:00Z').getTime();
      // 6 readings: consuming 10% per 10-minute interval = 60% per hour
      // current fuel = 0.5% → autonomy = 0.5/60 hours ≈ 0.008h → well below 1h
      const readings = Array.from({ length: 6 }, (_, i) =>
        telemetryFactory({
          id: `tel-${i}`,
          fuel_level: 0.5 + i * 10, // newest = 0.5, oldest = 50.5 (DESCENDING order)
          timestamp: new Date(baseTime - i * 10 * 60 * 1000), // 10 min apart
        }),
      );

      const currentRow = telemetryFactory({
        fuel_level: 0.5,
        timestamp: new Date(baseTime),
      });
      (telemetryRepo.create as jest.Mock).mockReturnValue(currentRow);
      (telemetryRepo.save as jest.Mock).mockResolvedValue(currentRow);
      (telemetryRepo.find as jest.Mock).mockResolvedValue(readings);
      mockAlertsService.findUnresolvedLowFuel.mockResolvedValue(null);
      mockAlertsService.createAlert.mockResolvedValue({});

      const result = (await service.ingest({
        ...dto,
        fuel_level: 0.5,
      })) as Record<string, unknown>;

      expect(result['alert_generated']).toBe(true);
      expect(mockAlertsService.createAlert).toHaveBeenCalledWith(
        vehicle.id,
        vehicle.name,
        'low_fuel',
        expect.stringContaining('minutos'),
      );
    });

    it('should not generate duplicate alert when unresolved low_fuel already exists', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);

      const baseTime = new Date('2024-01-01T10:00:00Z').getTime();
      const readings = Array.from({ length: 6 }, (_, i) =>
        telemetryFactory({
          id: `tel-${i}`,
          fuel_level: 0.5 + i * 10,
          timestamp: new Date(baseTime - i * 10 * 60 * 1000),
        }),
      );

      const currentRow = telemetryFactory({
        fuel_level: 0.5,
        timestamp: new Date(baseTime),
      });
      (telemetryRepo.create as jest.Mock).mockReturnValue(currentRow);
      (telemetryRepo.save as jest.Mock).mockResolvedValue(currentRow);
      (telemetryRepo.find as jest.Mock).mockResolvedValue(readings);
      mockAlertsService.findUnresolvedLowFuel.mockResolvedValue({
        id: 'existing-alert',
      });

      const result = (await service.ingest({
        ...dto,
        fuel_level: 0.5,
      })) as Record<string, unknown>;

      expect(result['alert_generated']).toBe(false);
      expect(mockAlertsService.createAlert).not.toHaveBeenCalled();
    });
  });

  describe('evaluateFuel (via ingest)', () => {
    it('should return false and skip alert when fuel_level is null', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);
      const row = telemetryFactory({ fuel_level: null });
      (telemetryRepo.create as jest.Mock).mockReturnValue(row);
      (telemetryRepo.save as jest.Mock).mockResolvedValue(row);
      (telemetryRepo.find as jest.Mock).mockResolvedValue([row]);

      const result = (await service.ingest({
        vehicle_id: 'v-uuid-1',
        lat: 6.2,
        lng: -75.5,
        fuel_level: undefined,
      })) as Record<string, unknown>;

      expect(result['alert_generated']).toBe(false);
      expect(mockAlertsService.createAlert).not.toHaveBeenCalled();
    });

    it('should not generate alert when fewer than 2 readings exist', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);
      const row = telemetryFactory({ fuel_level: 5 });
      (telemetryRepo.create as jest.Mock).mockReturnValue(row);
      (telemetryRepo.save as jest.Mock).mockResolvedValue(row);
      (telemetryRepo.find as jest.Mock).mockResolvedValue([row]); // only 1 reading

      const result = (await service.ingest({
        vehicle_id: 'v-uuid-1',
        lat: 6.2,
        lng: -75.5,
        fuel_level: 5,
      })) as Record<string, unknown>;
      expect(result['alert_generated']).toBe(false);
    });

    it('should not generate alert when consumption rate is zero or negative', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);

      const baseTime = new Date('2024-01-01T10:00:00Z').getTime();
      // Fuel increasing (e.g., refueled) — no consumption
      const readings = [
        telemetryFactory({ fuel_level: 80, timestamp: new Date(baseTime) }),
        telemetryFactory({
          fuel_level: 75,
          timestamp: new Date(baseTime - 3_600_000),
        }), // older has lower fuel
      ];

      const currentRow = telemetryFactory({ fuel_level: 80 });
      (telemetryRepo.create as jest.Mock).mockReturnValue(currentRow);
      (telemetryRepo.save as jest.Mock).mockResolvedValue(currentRow);
      (telemetryRepo.find as jest.Mock).mockResolvedValue(readings);

      const result = (await service.ingest({
        vehicle_id: 'v-uuid-1',
        lat: 6.2,
        lng: -75.5,
        fuel_level: 80,
      })) as Record<string, unknown>;
      expect(result['alert_generated']).toBe(false);
    });

    it('should not generate alert when autonomy is >= 1 hour', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);

      const baseTime = new Date('2024-01-01T10:00:00Z').getTime();
      // 80% fuel, consuming 1% per hour → 80 hours autonomy
      const readings = [
        telemetryFactory({ fuel_level: 80, timestamp: new Date(baseTime) }),
        telemetryFactory({
          fuel_level: 81,
          timestamp: new Date(baseTime - 3_600_000),
        }),
      ];

      const currentRow = telemetryFactory({ fuel_level: 80 });
      (telemetryRepo.create as jest.Mock).mockReturnValue(currentRow);
      (telemetryRepo.save as jest.Mock).mockResolvedValue(currentRow);
      (telemetryRepo.find as jest.Mock).mockResolvedValue(readings);

      const result = (await service.ingest({
        vehicle_id: 'v-uuid-1',
        lat: 6.2,
        lng: -75.5,
        fuel_level: 80,
      })) as Record<string, unknown>;
      expect(result['alert_generated']).toBe(false);
    });
  });

  describe('findByVehicle', () => {
    it('should return paginated telemetry data', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicleFactory());
      const rows = [telemetryFactory()];
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([rows, 1]),
      };
      (telemetryRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = (await service.findByVehicle('v-uuid-1', 1, 50)) as Record<
        string,
        unknown
      >;

      expect(result['data']).toEqual(rows);
      expect(result['total']).toBe(1);
      expect(result['page']).toBe(1);
      expect(result['limit']).toBe(50);
    });

    it('should apply from/to date filters when provided', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicleFactory());
      const qb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      (telemetryRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      await service.findByVehicle(
        'v-uuid-1',
        1,
        10,
        '2024-01-01',
        '2024-01-31',
      );

      expect(qb.andWhere).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.findByVehicle('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findLatest', () => {
    it('should return the latest telemetry row', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicleFactory());
      const row = telemetryFactory({
        lat: 6.2442,
        lng: -75.5812,
        speed: 60,
        fuel_level: 80,
        temperature: 90,
      });
      (telemetryRepo.findOne as jest.Mock).mockResolvedValue(row);

      const result = (await service.findLatest('v-uuid-1')) as Record<
        string,
        unknown
      >;

      expect(result['lat']).toBe(Number(row.lat));
      expect(result['lng']).toBe(Number(row.lng));
    });

    it('should throw NotFoundException when no telemetry exists', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicleFactory());
      (telemetryRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findLatest('v-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.findLatest('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle null speed, fuel_level, and temperature gracefully', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicleFactory());
      const row = telemetryFactory({
        speed: null,
        fuel_level: null,
        temperature: null,
      });
      (telemetryRepo.findOne as jest.Mock).mockResolvedValue(row);

      const result = (await service.findLatest('v-uuid-1')) as Record<
        string,
        unknown
      >;
      expect(result['speed']).toBeNull();
      expect(result['fuel_level']).toBeNull();
      expect(result['temperature']).toBeNull();
    });
  });
});
