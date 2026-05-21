import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { SimulationService } from '../simulation/simulation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Vehicle } from './entities/vehicle.entity';

const mockVehiclesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockSimulationService = {
  startVehicle: jest.fn(),
  stopVehicle: jest.fn(),
};

const adminReq = { user: { sub: 'u1', role: 'admin' } };
const userReq = { user: { sub: 'u2', role: 'user' } };

describe('VehiclesController', () => {
  let controller: VehiclesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        { provide: VehiclesService, useValue: mockVehiclesService },
        { provide: SimulationService, useValue: mockSimulationService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /vehicles', () => {
    it('should call findAll with the user role', async () => {
      const vehicles = [{ id: 'v1', device_id: 'DEV-****-XC54' }];
      mockVehiclesService.findAll.mockResolvedValue(vehicles);

      const result = await controller.findAll(userReq);

      expect(mockVehiclesService.findAll).toHaveBeenCalledWith('user');
      expect(result).toEqual(vehicles);
    });

    it('should pass admin role when request user is admin', async () => {
      mockVehiclesService.findAll.mockResolvedValue([]);
      await controller.findAll(adminReq);
      expect(mockVehiclesService.findAll).toHaveBeenCalledWith('admin');
    });
  });

  describe('GET /vehicles/:id', () => {
    it('should call findOne with id and user role', async () => {
      const vehicle = { id: 'v1', device_id: 'DEV-****-XC54' };
      mockVehiclesService.findOne.mockResolvedValue(vehicle);

      const result = await controller.findOne('v1', userReq);

      expect(mockVehiclesService.findOne).toHaveBeenCalledWith('v1', 'user');
      expect(result).toEqual(vehicle);
    });
  });

  describe('POST /vehicles', () => {
    it('should create a vehicle and start simulation', async () => {
      const vehicle = {
        id: 'v1',
        device_id: 'DEV-AB12-CD34',
        name: 'Bus 01',
        city: 'medellin',
        status: 'active',
      } as Vehicle;
      mockVehiclesService.create.mockResolvedValue(vehicle);

      const result = await controller.create({
        name: 'Bus 01',
        city: 'medellin',
      });

      expect(mockVehiclesService.create).toHaveBeenCalledWith({
        name: 'Bus 01',
        city: 'medellin',
      });
      expect(mockSimulationService.startVehicle).toHaveBeenCalledWith(vehicle);
      expect(result).toEqual(vehicle);
    });
  });

  describe('PUT /vehicles/:id', () => {
    it('should stop simulation when status is set to inactive', async () => {
      mockVehiclesService.update.mockResolvedValue({
        id: 'v1',
        status: 'inactive',
      });

      await controller.update('v1', { status: 'inactive' }, adminReq);

      expect(mockSimulationService.stopVehicle).toHaveBeenCalledWith('v1');
      expect(mockSimulationService.startVehicle).not.toHaveBeenCalled();
    });

    it('should start simulation when status is set to active', async () => {
      const vehicleData = {
        id: 'v1',
        city: 'bogota',
        device_id: 'DEV-ABCD-1234',
        status: 'active',
      };
      mockVehiclesService.findOne.mockResolvedValue(vehicleData);
      mockVehiclesService.update.mockResolvedValue(vehicleData);

      await controller.update('v1', { status: 'active' }, adminReq);

      expect(mockSimulationService.startVehicle).toHaveBeenCalled();
    });

    it('should update without touching simulation when status is not changed', async () => {
      const vehicleData = { id: 'v1', name: 'Bus Updated' };
      mockVehiclesService.update.mockResolvedValue(vehicleData);

      await controller.update('v1', { name: 'Bus Updated' }, adminReq);

      expect(mockSimulationService.stopVehicle).not.toHaveBeenCalled();
      expect(mockSimulationService.startVehicle).not.toHaveBeenCalled();
    });

    it('should call vehiclesService.update with correct arguments', async () => {
      mockVehiclesService.update.mockResolvedValue({ id: 'v1' });

      await controller.update('v1', { name: 'New Name' }, adminReq);

      expect(mockVehiclesService.update).toHaveBeenCalledWith(
        'v1',
        { name: 'New Name' },
        'admin',
      );
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('should stop simulation and remove vehicle', async () => {
      mockVehiclesService.remove.mockResolvedValue(undefined);

      await controller.remove('v1');

      expect(mockSimulationService.stopVehicle).toHaveBeenCalledWith('v1');
      expect(mockVehiclesService.remove).toHaveBeenCalledWith('v1');
    });
  });
});
