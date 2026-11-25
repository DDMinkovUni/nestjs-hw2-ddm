import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsModule } from './bookings/bookings.module.js';
import { buildDatabaseOptions } from './config/database.config.js';
import { EnvironmentVariables, validateEnv } from './config/env.validation.js';
import { FilmsModule } from './films/films.module.js';
import { HallsModule } from './halls/halls.module.js';
import { ShowingsModule } from './showings/showings.module.js';

@Module({
  imports: [
    // Reads .env and runs validateEnv() on it. If a DB_* variable is missing
    // or wrong, the app stops here, before trying to connect.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),

    // forRootAsync: wait until ConfigService is ready, then build the
    // connection from its values. Config comes from ConfigService, never
    // from process.env directly.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        ...buildDatabaseOptions({
          DB_HOST: config.get('DB_HOST', { infer: true }),
          DB_PORT: config.get('DB_PORT', { infer: true }),
          DB_USERNAME: config.get('DB_USERNAME', { infer: true }),
          DB_PASSWORD: config.get('DB_PASSWORD', { infer: true }),
          DB_NAME: config.get('DB_NAME', { infer: true }),
        }),
        // Pick up every entity registered with TypeOrmModule.forFeature()
        // in the modules, so we don't list them twice.
        autoLoadEntities: true,
      }),
    }),

    FilmsModule,
    HallsModule,
    ShowingsModule,
    BookingsModule,
  ],
})
export class AppModule {}
