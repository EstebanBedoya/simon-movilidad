import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const mockTelemetryService = {
  ingest: jest.fn(),
  findLatest: jest.fn(),
  findByVehicle: jest.fn(),
};

describe('TelemetryController', () => {
  let controller: TelemetryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [
        { provide: TelemetryService, useValue: mockTelemetryService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TelemetryController>(TelemetryController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /telemetry', () => {
    it('should call ingest with the DTO and return the result', async () => {
      const dto = { vehicle_id: 'v1', lat: 6.2, lng: -75.5 };
      const result = { id: 'tel-1', alert_generated: false };
      mockTelemetryService.ingest.mockResolvedValue(result);

      const response = await controller.ingest(dto);

      expect(mockTelemetryService.ingest).toHaveBeenCalledWith(dto);
      expect(response).toEqual(result);
    });
  });

  describe('GET /telemetry/:vehicleId/latest', () => {
    it('should call findLatest with vehicleId and return the result', async () => {
      const latest = { lat: 6.2, lng: -75.5, timestamp: new Date() };
      mockTelemetryService.findLatest.mockResolvedValue(latest);

      const response = await controller.findLatest('v-uuid-1');

      expect(mockTelemetryService.findLatest).toHaveBeenCalledWith('v-uuid-1');
      expect(response).toEqual(latest);
    });
  });

  describe('GET /telemetry/:vehicleId', () => {
    it('should call findByVehicle with vehicleId and pagination params', async () => {
      const paginated = { data: [], total: 0, page: 1, limit: 50 };
      mockTelemetryService.findByVehicle.mockResolvedValue(paginated);

      const response = await controller.findAll('v-uuid-1', {
        page: 1,
        limit: 50,
      });

      expect(mockTelemetryService.findByVehicle).toHaveBeenCalledWith(
        'v-uuid-1',
        1,
        50,
        undefined,
        undefined,
      );
      expect(response).toEqual(paginated);
    });

    it('should pass from/to date filters when provided', async () => {
      const paginated = { data: [], total: 0, page: 2, limit: 10 };
      mockTelemetryService.findByVehicle.mockResolvedValue(paginated);

      await controller.findAll('v-uuid-1', {
        page: 2,
        limit: 10,
        from: '2024-01-01',
        to: '2024-01-31',
      });

      expect(mockTelemetryService.findByVehicle).toHaveBeenCalledWith(
        'v-uuid-1',
        2,
        10,
        '2024-01-01',
        '2024-01-31',
      );
    });
  });
});
