import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsPositive,
  ValidateNested,
} from 'class-validator';

export class SeatInputDto {
  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @IsPositive()
  row: number;

  @ApiProperty({ example: 3, minimum: 1 })
  @IsInt()
  @IsPositive()
  seat: number;
}

export class CreateBookingDto {
  @ApiProperty({
    type: [SeatInputDto],
    example: [
      { row: 2, seat: 3 },
      { row: 2, seat: 4 },
    ],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'seats must contain at least one seat' })
  // ArrayUnique normally compares elements with ===, and two different objects
  // are never ===. The function turns each seat into a "row:seat" string,
  // so {row:2,seat:3} twice counts as a duplicate.
  @ArrayUnique(
    (s: SeatInputDto) =>
      s && typeof s === 'object' ? `${s.row}:${s.seat}` : s,
    {
      message: 'seats must not contain the same seat twice',
    },
  )
  // ValidateNested + @Type: run SeatInputDto's rules on every element.
  // @Type tells class-transformer to turn each plain {row, seat} into a SeatInputDto;
  // without it the nested rules would silently never run.
  @ValidateNested({ each: true })
  @Type(() => SeatInputDto)
  seats: SeatInputDto[];
}
