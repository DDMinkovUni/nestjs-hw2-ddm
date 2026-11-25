import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

// The body of POST /films. ValidationPipe checks every decorator below
// before the controller method runs. If any check fails, the client gets 400
// and the service is never called.
export class CreateFilmDto {
  @ApiProperty({ example: 'Dune: Part Two' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 166,
    minimum: 1,
    description: 'Positive integer, minutes',
  })
  @IsInt()
  @IsPositive()
  durationMinutes: number;

  @ApiProperty({ example: 2024, minimum: 1888, maximum: 2100 })
  @IsInt()
  @Min(1888) // the first film ever made
  @Max(2100)
  releaseYear: number;
}
