import { Test, TestingModule } from '@nestjs/testing';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const mockAlertsService = {
  findAll: jest.fn(),
  findByVehicle: jest.fn(),
  resolve: jest.fn(),
};

describe('AlertsController', () => {
  let controller: AlertsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertsController],
      providers: [{ provide: AlertsService, useValue: mockAlertsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AlertsController>(AlertsController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /alerts', () => {
    it('should call findAll without filters', async () => {
      mockAlertsService.findAll.mockResolvedValue([]);
      const result = await controller.findAll(undefined, undefined);
      expect(mockAlertsService.findAll).toHaveBeenCalledWith({
        resolved: undefined,
        type: undefined,
      });
      expect(result).toEqual([]);
    });

    it('should call findAll with resolved filter', async () => {
      mockAlertsService.findAll.mockResolvedValue([]);
      await controller.findAll('false', undefined);
      expect(mockAlertsService.findAll).toHaveBeenCalledWith({
        resolved: 'false',
        type: undefined,
      });
    });

    it('should call findAll with type filter', async () => {
      mockAlertsService.findAll.mockResolvedValue([]);
      await controller.findAll(undefined, 'low_fuel');
      expect(mockAlertsService.findAll).toHaveBeenCalledWith({
        resolved: undefined,
        type: 'low_fuel',
      });
    });

    it('should call findAll with both filters', async () => {
      const alerts = [{ id: 'a1', type: 'low_fuel', resolved: false }];
      mockAlertsService.findAll.mockResolvedValue(alerts);

      const result = await controller.findAll('false', 'low_fuel');
      expect(mockAlertsService.findAll).toHaveBeenCalledWith({
        resolved: 'false',
        type: 'low_fuel',
      });
      expect(result).toEqual(alerts);
    });
  });

  describe('GET /alerts/:vehicleId', () => {
    it('should call findByVehicle with the vehicleId', async () => {
      const alerts = [{ id: 'a1' }];
      mockAlertsService.findByVehicle.mockResolvedValue(alerts);

      const result = await controller.findByVehicle('v-uuid-1');
      expect(mockAlertsService.findByVehicle).toHaveBeenCalledWith('v-uuid-1');
      expect(result).toEqual(alerts);
    });
  });

  describe('PATCH /alerts/:id/resolve', () => {
    it('should call resolve with the alert id', async () => {
      const resolved = { id: 'a1', resolved: true, resolved_at: new Date() };
      mockAlertsService.resolve.mockResolvedValue(resolved);

      const result = await controller.resolve('a1');
      expect(mockAlertsService.resolve).toHaveBeenCalledWith('a1');
      expect(result).toEqual(resolved);
    });
  });
});
