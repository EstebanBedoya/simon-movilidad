import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { User } from './auth/user.entity';
import { Vehicle, VehicleCity, VehicleStatus } from './vehicles/entities/vehicle.entity';
import { Telemetry } from './telemetry/entities/telemetry.entity';
import { Alert } from './alerts/entities/alert.entity';

dotenv.config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'simon',
  password: process.env.DB_PASSWORD ?? 'simon123',
  database: process.env.DB_NAME ?? 'simon_movilidad',
  entities: [User, Vehicle, Telemetry, Alert],
  synchronize: false,
});

const CITIES: VehicleCity[] = [
  'medellin',
  'bogota',
  'cali',
  'barranquilla',
  'cartagena',
  'bucaramanga',
];

const VEHICLE_TYPES = [
  'Bus',
  'Buseta',
  'Articulado',
  'Colectivo',
  'Microbús',
  'Van',
  'Alimentador',
];

const ROUTES: Record<VehicleCity, string[]> = {
  medellin: ['Ruta 101', 'Ruta 102', 'Ruta 305', 'Ruta 412', 'Circular Sur', 'Circular Norte', 'Metro Feeder'],
  bogota: ['SITP Norte', 'SITP Sur', 'SITP Usaquén', 'Troncal Caracas', 'Troncal NQS', 'Ruta 241', 'Ruta 328'],
  cali: ['MIO T1', 'MIO T2', 'MIO Alimentador', 'Ruta 610', 'Ruta 720', 'Circular Oeste', 'Ruta 115'],
  barranquilla: ['Ruta B1', 'Ruta B2', 'Ruta B3', 'Transmetro L1', 'Transmetro L2', 'Circular Centro', 'Ruta B7'],
  cartagena: ['Ruta C1', 'Ruta C2', 'Transcaribe L1', 'Ruta C4', 'Circular Histórico', 'Ruta C6', 'Ruta C7'],
  bucaramanga: ['Metrolínea L1', 'Metrolínea L2', 'Ruta BU3', 'Ruta BU4', 'Circular Floridablanca', 'Ruta BU6', 'Ruta BU7'],
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildDeviceId(index: number): string {
  const hex = index.toString(16).toUpperCase().padStart(4, '0');
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `DEV-${hex}-${rand}`;
}

function buildVehicles(): Partial<Vehicle>[] {
  const vehicles: Partial<Vehicle>[] = [];

  // Distribute 50 vehicles across 6 cities (~8-9 per city)
  const distribution: [VehicleCity, number][] = [
    ['bogota', 10],
    ['medellin', 9],
    ['cali', 8],
    ['barranquilla', 8],
    ['cartagena', 8],
    ['bucaramanga', 7],
  ];

  let index = 1;
  for (const [city, count] of distribution) {
    const routes = ROUTES[city];
    for (let i = 0; i < count; i++) {
      const type = randomItem(VEHICLE_TYPES);
      const route = randomItem(routes);
      const status: VehicleStatus = Math.random() > 0.15 ? 'active' : 'inactive';
      vehicles.push({
        device_id: buildDeviceId(index),
        name: `${type} ${route}`,
        city,
        status,
      });
      index++;
    }
  }

  return vehicles;
}

async function seed() {
  await ds.initialize();
  console.log('Connected to database');

  const userRepo = ds.getRepository(User);
  const vehicleRepo = ds.getRepository(Vehicle);

  // Reset
  console.log('Dropping existing data...');
  await ds.query('TRUNCATE TABLE telemetry, alerts, vehicles, users RESTART IDENTITY CASCADE');

  // Users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  await userRepo.save([
    { email: 'admin@simon.com', password_hash: passwordHash, role: 'admin' as const },
    { email: 'user@simon.com', password_hash: passwordHash, role: 'user' as const },
  ]);

  // Vehicles
  console.log('Creating 50 vehicles...');
  const vehicles = buildVehicles();
  await vehicleRepo.save(vehicles);

  const counts = await vehicleRepo
    .createQueryBuilder('v')
    .select('v.city', 'city')
    .addSelect('COUNT(*)', 'count')
    .groupBy('v.city')
    .getRawMany<{ city: string; count: string }>();

  console.log('\nDone! Summary:');
  console.log('  Users: admin@simon.com / user@simon.com (password: password123)');
  console.log('  Vehicles by city:');
  for (const row of counts) {
    console.log(`    ${row.city}: ${row.count}`);
  }

  await ds.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
