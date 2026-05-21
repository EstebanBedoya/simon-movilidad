import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Telemetry } from './entities/telemetry.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';
import { TelemetryGateway } from './telemetry.gateway';
import { AlertsModule } from '../alerts/alerts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Telemetry, Vehicle]),
    AlertsModule,
    AuthModule,
  ],
  providers: [TelemetryService, TelemetryGateway],
  controllers: [TelemetryController],
  exports: [TelemetryService],
})
export class TelemetryModule {}
