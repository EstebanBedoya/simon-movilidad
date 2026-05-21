import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import { Telemetry } from '../telemetry/entities/telemetry.entity';

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

const mockVehicleRepo = () =>
  ({
    find: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  }) as unknown as Repository<Vehicle>;

const mockTelemetryRepo = () =>
  ({
    findOne: jest.fn(),
  }) as unknown as Repository<Telemetry>;

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepo: ReturnType<typeof mockVehicleRepo>;
  let telemetryRepo: ReturnType<typeof mockTelemetryRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useFactory: mockVehicleRepo },
        {
          provide: getRepositoryToken(Telemetry),
          useFactory: mockTelemetryRepo,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    vehicleRepo = module.get(getRepositoryToken(Vehicle));
    telemetryRepo = module.get(getRepositoryToken(Telemetry));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return full device_id for admin role', async () => {
      (vehicleRepo.find as jest.Mock).mockResolvedValue([vehicleFactory()]);
      const result = await service.findAll('admin');
      expect((result[0] as Record<string, unknown>)['device_id']).toBe(
        'DEV-A1B2-XC54',
      );
    });

    it('should return masked device_id for user role', async () => {
      (vehicleRepo.find as jest.Mock).mockResolvedValue([vehicleFactory()]);
      const result = await service.findAll('user');
      expect((result[0] as Record<string, unknown>)['device_id']).toBe(
        'DEV-****-XC54',
      );
    });

    it('should return empty array when there are no vehicles', async () => {
      (vehicleRepo.find as jest.Mock).mockResolvedValue([]);
      const result = await service.findAll('admin');
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return vehicle with latest_telemetry when vehicle exists', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);
      const telRow: Partial<Telemetry> = {
        lat: 6.2442,
        lng: -75.5812,
        speed: 60,
        fuel_level: 80,
        temperature: 90,
        timestamp: new Date('2024-01-02'),
      };
      (telemetryRepo.findOne as jest.Mock).mockResolvedValue(telRow);

      const result = (await service.findOne('v-uuid-1', 'admin')) as Record<
        string,
        unknown
      >;

      expect(result['device_id']).toBe('DEV-A1B2-XC54');
      expect(result['latest_telemetry']).not.toBeNull();
    });

    it('should return null latest_telemetry when no telemetry exists', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicleFactory());
      (telemetryRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = (await service.findOne('v-uuid-1', 'user')) as Record<
        string,
        unknown
      >;
      expect(result['latest_telemetry']).toBeNull();
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne('nonexistent', 'admin')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should mask device_id for non-admin role', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicleFactory());
      (telemetryRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = (await service.findOne('v-uuid-1', 'user')) as Record<
        string,
        unknown
      >;
      expect(result['device_id']).toBe('DEV-****-XC54');
    });
  });

  describe('create', () => {
    it('should generate a device_id matching DEV-XXXX-XXXX format', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      const created = vehicleFactory({ device_id: 'DEV-AB12-CD34' });
      (vehicleRepo.create as jest.Mock).mockReturnValue(created);
      (vehicleRepo.save as jest.Mock).mockResolvedValue(created);

      const result = await service.create({ name: 'Bus 01', city: 'medellin' });
      expect(result.device_id).toMatch(/^DEV-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should retry device_id generation when a collision occurs', async () => {
      (vehicleRepo.findOneBy as jest.Mock)
        .mockResolvedValueOnce({ id: 'conflict' })
        .mockResolvedValue(null);
      const created = vehicleFactory();
      (vehicleRepo.create as jest.Mock).mockReturnValue(created);
      (vehicleRepo.save as jest.Mock).mockResolvedValue(created);

      await service.create({ name: 'Bus 01', city: 'bogota' });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vehicleRepo.findOneBy as jest.Mock).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('should return updated vehicle with masked device_id for non-admin', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);
      (vehicleRepo.save as jest.Mock).mockResolvedValue(vehicle);

      const result = (await service.update(
        'v-uuid-1',
        { name: 'Bus Updated' },
        'user',
      )) as Record<string, unknown>;
      expect(result['name']).toBe('Bus Updated');
      expect(result['device_id']).toBe('DEV-****-XC54');
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(
        service.update('nonexistent', { name: 'X' }, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should call repository.remove when vehicle exists', async () => {
      const vehicle = vehicleFactory();
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(vehicle);
      (vehicleRepo.remove as jest.Mock).mockResolvedValue(undefined);

      await service.remove('v-uuid-1');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vehicleRepo.remove as jest.Mock).toHaveBeenCalledWith(vehicle);
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      (vehicleRepo.findOneBy as jest.Mock).mockResolvedValue(null);
      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findActiveVehicles', () => {
    it('should return only active vehicles', async () => {
      const active = [vehicleFactory({ status: 'active' })];
      (vehicleRepo.findBy as jest.Mock).mockResolvedValue(active);

      const result = await service.findActiveVehicles();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vehicleRepo.findBy as jest.Mock).toHaveBeenCalledWith({
        status: 'active',
      });
      expect(result).toEqual(active);
    });

    it('should return empty array when no active vehicles exist', async () => {
      (vehicleRepo.findBy as jest.Mock).mockResolvedValue([]);
      const result = await service.findActiveVehicles();
      expect(result).toEqual([]);
    });
  });
});
