import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { CreateTelemetryDto, TelemetryQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('telemetry')
@UseGuards(JwtAuthGuard)
export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  @Post()
  ingest(@Body() dto: CreateTelemetryDto) {
    return this.telemetryService.ingest(dto);
  }

  @Get(':vehicleId/latest')
  findLatest(@Param('vehicleId') vehicleId: string) {
    return this.telemetryService.findLatest(vehicleId);
  }

  @Get(':vehicleId')
  findAll(
    @Param('vehicleId') vehicleId: string,
    @Query() q: TelemetryQueryDto,
  ) {
    return this.telemetryService.findByVehicle(
      vehicleId,
      q.page,
      q.limit,
      q.from,
      q.to,
    );
  }
}
