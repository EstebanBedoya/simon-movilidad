import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  findAll(@Query('resolved') resolved?: string, @Query('type') type?: string) {
    return this.alertsService.findAll({ resolved, type });
  }

  @Get(':vehicleId')
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.alertsService.findByVehicle(vehicleId);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.alertsService.resolve(id);
  }
}
