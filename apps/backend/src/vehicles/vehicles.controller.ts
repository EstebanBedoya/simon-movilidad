import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';
import { SimulationService } from '../simulation/simulation.service';

interface AuthRequest {
  user: { sub: string; role: string };
}

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(
    private vehiclesService: VehiclesService,
    private simulationService: SimulationService,
  ) {}

  @Get()
  findAll(@Req() req: AuthRequest) {
    return this.vehiclesService.findAll(req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.vehiclesService.findOne(id, req.user.role);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateVehicleDto) {
    const vehicle = await this.vehiclesService.create(dto);
    this.simulationService.startVehicle(vehicle);
    return vehicle;
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @Req() req: AuthRequest,
  ) {
    if (dto.status === 'inactive') {
      this.simulationService.stopVehicle(id);
    } else if (dto.status === 'active') {
      const vehicle = (await this.vehiclesService.findOne(id, 'admin')) as {
        id: string;
        city: string;
        device_id: string;
      };
      this.simulationService.startVehicle(vehicle as never);
    }
    return this.vehiclesService.update(id, dto, req.user.role);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    this.simulationService.stopVehicle(id);
    return this.vehiclesService.remove(id);
  }
}
