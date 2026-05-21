import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsGateway } from './alerts.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alert]), AuthModule],
  providers: [AlertsService, AlertsGateway],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}
