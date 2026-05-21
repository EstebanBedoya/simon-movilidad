import { forwardRef, Module } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [forwardRef(() => VehiclesModule), TelemetryModule],
  providers: [SimulationService],
  exports: [SimulationService],
})
export class SimulationModule {}
