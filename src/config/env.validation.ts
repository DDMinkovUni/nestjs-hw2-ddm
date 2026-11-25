import { plainToInstance, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

// Describes every environment variable the app needs, with the same
// class-validator decorators we use in DTOs. If something is missing or
// wrong, validateEnv() throws and the app refuses to start.
export class EnvironmentVariables {
  @IsOptional()
  @Type(() => Number) // "3000" (string from .env) -> 3000
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DB_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  DB_PORT: number;

  @IsString()
  @IsNotEmpty()
  DB_USERNAME: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME: string;
}

// Used by ConfigModule (app), data-source.ts (migration CLI) and seed.ts.
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  // Everything in .env is a string. @Type(() => Number) on the numeric
  // fields turns "5432" into 5432 before validation runs.
  const env = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => `  - ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return env;
}
