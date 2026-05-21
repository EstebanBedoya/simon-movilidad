import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum([
    'medellin',
    'bogota',
    'cali',
    'barranquilla',
    'cartagena',
    'bucaramanga',
  ])
  city!: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum([
    'medellin',
    'bogota',
    'cali',
    'barranquilla',
    'cartagena',
    'bucaramanga',
  ])
  city?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}
