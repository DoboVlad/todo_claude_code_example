import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsOptional()
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsOptional()
  @IsNumber()
  PORT: number = 3000;

  // Required — app cannot function without a database
  @IsString()
  DATABASE_URL: string;

  // Required — Google OAuth secrets
  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  GOOGLE_CLIENT_SECRET: string;

  @IsOptional()
  @IsString()
  GOOGLE_CALLBACK_URL: string = 'http://localhost:3000/auth/google/callback';

  // Required — JWT signing secrets
  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL: string = '15m';

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_TTL: string = '7d';

  @IsOptional()
  @IsString()
  FRONTEND_URL: string = 'http://localhost:4200';

  @IsOptional()
  @IsString()
  COOKIE_DOMAIN: string = 'localhost';
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  return validated;
}
