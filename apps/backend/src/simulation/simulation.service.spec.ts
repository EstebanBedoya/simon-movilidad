import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SimulationService } from './simulation.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { AlertsService } from '../alerts/alerts.service';
import { Vehicle } from '../vehicles/entities/vehicle.entity';

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

const mockVehiclesService = {
  findActiveVehicles: jest.fn(),
};

const mockTelemetryService = {
  ingest: jest.fn(),
  findLatestTimestamp: jest.fn(),
};

const mockAlertsService = {
  findUnresolved: jest.fn(),
  createAlert: jest.fn(),
};

describe('SimulationService', () => {
  let service: SimulationService;

  const buildModule = async (simulate: string, intervalMs?: string) => {
    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'SIMULATE') return simulate;
        if (key === 'SIMULATE_INTERVAL_MS') return intervalMs ?? '100';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationService,
        { provide: VehiclesService, useValue: mockVehiclesService },
        { provide: TelemetryService, useValue: mockTelemetryService },
        { provide: AlertsService, useValue: mockAlertsService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    return module.get<SimulationService>(SimulationService);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('onModuleInit', () => {
    it('should start timers for active vehicles when SIMULATE=true', async () => {
      service = await buildModule('true');
      const vehicles = [vehicleFactory()];
      mockVehiclesService.findActiveVehicles.mockResolvedValue(vehicles);
      mockTelemetryService.ingest.mockResolvedValue({ alert_generated: false });

      await service.onModuleInit();

      // Advance timer to trigger one tick
      jest.advanceTimersByTime(200);
      await Promise.resolve();

      expect(mockVehiclesService.findActiveVehicles).toHaveBeenCalledTimes(1);
      expect(mockTelemetryService.ingest).toHaveBeenCalled();
    });

    it('should not start any timers when SIMULATE=false', async () => {
      service = await buildModule('false');
      mockVehiclesService.findActiveVehicles.mockResolvedValue([]);

      await service.onModuleInit();

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(mockVehiclesService.findActiveVehicles).not.toHaveBeenCalled();
      expect(mockTelemetryService.ingest).not.toHaveBeenCalled();
    });
  });

  describe('startVehicle', () => {
    it('should create a timer and initialize state for the vehicle', async () => {
      service = await buildModule('true');
      mockTelemetryService.ingest.mockResolvedValue({ alert_generated: false });

      const vehicle = vehicleFactory();
      service.startVehicle(vehicle);

      jest.advanceTimersByTime(200);
      await Promise.resolve();

      expect(mockTelemetryService.ingest).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicle_id: 'v-uuid-1',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          lat: expect.any(Number),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          lng: expect.any(Number),
        }),
      );
    });

    it('should not start a second timer when vehicle is already tracked', async () => {
      service = await buildModule('true', '1000');
      mockTelemetryService.ingest.mockResolvedValue({ alert_generated: false });

      const vehicle = vehicleFactory();
      service.startVehicle(vehicle);
      service.startVehicle(vehicle); // second call — should be no-op

      jest.advanceTimersByTime(1200);
      await Promise.resolve();

      // Only one timer should exist — one tick fires
      expect(mockTelemetryService.ingest).toHaveBeenCalledTimes(1);
    });

    it('should not start a timer when simulation is disabled', async () => {
      service = await buildModule('false');

      service.startVehicle(vehicleFactory());

      jest.advanceTimersByTime(200);
      await Promise.resolve();

      expect(mockTelemetryService.ingest).not.toHaveBeenCalled();
    });
  });

  describe('stopVehicle', () => {
    it('should clear the timer and remove state for a tracked vehicle', async () => {
      service = await buildModule('true');
      mockTelemetryService.ingest.mockResolvedValue({ alert_generated: false });

      const vehicle = vehicleFactory();
      service.startVehicle(vehicle);
      service.stopVehicle(vehicle.id);

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(mockTelemetryService.ingest).not.toHaveBeenCalled();
    });

    it('should be a no-op when vehicle is not tracked', async () => {
      service = await buildModule('true');
      expect(() => service.stopVehicle('nonexistent')).not.toThrow();
    });
  });

  describe('tick (via timer)', () => {
    it('should call telemetryService.ingest with mutated lat/lng/fuel state', async () => {
      service = await buildModule('true');
      mockTelemetryService.ingest.mockResolvedValue({ alert_generated: false });

      const vehicle = vehicleFactory({ city: 'medellin' });
      service.startVehicle(vehicle);

      jest.advanceTimersByTime(150);
      await Promise.resolve();

      const call = mockTelemetryService.ingest.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(call[0]).toMatchObject({
        vehicle_id: 'v-uuid-1',
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        lat: expect.any(Number),
        lng: expect.any(Number),
        speed: expect.any(Number),
        fuel_level: expect.any(Number),
        temperature: expect.any(Number),
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      });
    });

    it('should call stopVehicle when ingest throws an error', async () => {
      service = await buildModule('true', '50');
      mockTelemetryService.ingest.mockRejectedValue(
        new Error('Vehicle deleted'),
      );

      const vehicle = vehicleFactory();
      service.startVehicle(vehicle);

      // Advance past first tick
      jest.advanceTimersByTime(60);
      // Flush microtasks so the rejected promise handler runs
      await Promise.resolve();
      await Promise.resolve();

      // Stop the vehicle (the tick error handler calls stopVehicle internally)
      // Advance more time — no further ingest should fire because timer was cleared
      jest.advanceTimersByTime(500);
      await Promise.resolve();

      // ingest was called once, then the vehicle was stopped on error
      expect(mockTelemetryService.ingest).toHaveBeenCalledTimes(1);
    }, 15000);
  });

  describe('onModuleDestroy', () => {
    it('should stop all timers', async () => {
      service = await buildModule('true');
      mockTelemetryService.ingest.mockResolvedValue({ alert_generated: false });

      service.startVehicle(vehicleFactory({ id: 'v1' }));
      service.startVehicle(vehicleFactory({ id: 'v2' }));

      service.onModuleDestroy();

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      expect(mockTelemetryService.ingest).not.toHaveBeenCalled();
    });
  });
});
