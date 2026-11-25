import type { DataSourceOptions } from 'typeorm';
import type { EnvironmentVariables } from './env.validation.js';

// One place that turns env values into TypeORM connection options.
// Both the Nest app (app.module.ts) and the CLI (data-source.ts) use it,
// so they can never connect to different databases by accident.
export function buildDatabaseOptions(
  env: Pick<
    EnvironmentVariables,
    'DB_HOST' | 'DB_PORT' | 'DB_USERNAME' | 'DB_PASSWORD' | 'DB_NAME'
  >,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    // Tables are created ONLY by migrations, never by TypeORM guessing from
    // entities. synchronize: true would silently change the schema; never use it.
    synchronize: false,
    // Default for uuid primary keys becomes gen_random_uuid() (pgcrypto).
    uuidExtension: 'pgcrypto',
  };
}
