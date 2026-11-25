import { registerDecorator, ValidationOptions } from 'class-validator';

// Custom class-validator decorator: the value must be a moment in the future.
// It's in the DTO (not the service) because it doesn't need any stored data,
// only the current clock.
export function IsFutureDate(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a date in the future`,
        ...options,
      },
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return true; // @IsISO8601 reports this
          const time = Date.parse(value);
          if (Number.isNaN(time)) return true; // @IsISO8601 reports this too
          return time > Date.now();
        },
      },
    });
  };
}
