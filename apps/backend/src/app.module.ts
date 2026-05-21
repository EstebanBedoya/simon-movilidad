import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { AlertsModule } from './alerts/alerts.module';
import { SimulationModule } from './simulation/simulation.module';
import { User } from './auth/user.entity';
import { Vehicle } from './vehicles/entities/vehicle.entity';
import { Telemetry } from './telemetry/entities/telemetry.entity';
import { Alert } from './alerts/entities/alert.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.getOrThrow('DB_USER'),
        password: config.getOrThrow('DB_PASSWORD'),
        database: config.getOrThrow('DB_NAME'),
        entities: [User, Vehicle, Telemetry, Alert],
        synchronize: config.get('NODE_ENV') !== 'production',
        timezone: 'Z',
      }),
    }),
    AuthModule,
    VehiclesModule,
    TelemetryModule,
    AlertsModule,
    SimulationModule,
  ],
})
export class AppModule {}
