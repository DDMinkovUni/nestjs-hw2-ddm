import { QueryFailedError } from 'typeorm';

// Postgres error codes we turn into HTTP answers.
// Full list: https://www.postgresql.org/docs/current/errcodes-appendix.html
export const PG_UNIQUE_VIOLATION = '23505'; // duplicate value in a unique column/index
export const PG_FOREIGN_KEY_VIOLATION = '23503'; // row is still referenced by another table

// TypeORM wraps every database error in QueryFailedError and keeps the
// original Postgres error in .driverError, where the 5-char code lives.
export function hasPgCode(error: unknown, code: string): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as { code?: string } | undefined;
  return driverError?.code === code;
}
