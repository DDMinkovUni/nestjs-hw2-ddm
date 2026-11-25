import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsPositive, IsUUID } from 'class-validator';
import { IsFutureDate } from '../../common/is-future-date.validator.js';

export class CreateShowingDto {
  // Only the format is checked here. Whether the film actually exists
  // needs the films array, so FilmsService answers that.
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  filmId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  hallId: string;

  @ApiProperty({
    example: '2030-01-15T18:00:00Z',
    description: 'ISO 8601 date-time, must be in the future',
  })
  // strict: rejects dates that look right but don't exist, like 2030-02-30
  @IsISO8601(
    { strict: true },
    { message: 'startsAt must be a valid ISO 8601 date' },
  )
  @IsFutureDate()
  startsAt: string;

  @ApiProperty({
    example: 12500,
    minimum: 1,
    description: 'Ticket price in kopecks',
  })
  @IsInt({ message: 'price must be an integer number of kopecks' })
  @IsPositive()
  price: number;
}
