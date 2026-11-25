// Connection used OUTSIDE the Nest app: by the TypeORM CLI (migrations)
// and by src/seed.ts. The Nest app itself connects via TypeOrmModule in
// app.module.ts. Both build options with the same buildDatabaseOptions().
import 'reflect-metadata';
import 'dotenv/config'; // loads .env into process.env
import { DataSource } from 'typeorm';
import { BookingSeat } from './bookings/entities/booking-seat.entity.js';
import { Booking } from './bookings/entities/booking.entity.js';
import { buildDatabaseOptions } from './config/database.config.js';
import { validateEnv } from './config/env.validation.js';
import { Film } from './films/entities/film.entity.js';
import { Hall } from './halls/entities/hall.entity.js';
import { Showing } from './showings/entities/showing.entity.js';

// Same validation as the app: a missing DB_* variable stops the CLI too.
const env = validateEnv(process.env);

const AppDataSource = new DataSource({
  ...buildDatabaseOptions(env),
  entities: [Film, Hall, Showing, Booking, BookingSeat],
  // Where migration files live. Run via tsx, so .ts files are fine.
  migrations: ['src/migrations/*.ts'],
});

// The TypeORM CLI (-d src/data-source.ts) requires exactly ONE exported
// DataSource, so it's only the default export. seed.ts imports it the same way.
export default AppDataSource;
