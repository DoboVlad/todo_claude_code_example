import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MinLength, validateSync } from 'class-validator';

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

  // Required — JWT signing secret; minimum 32 chars (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_ACCESS_TTL: string = '15m';

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

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  return validated;
}
