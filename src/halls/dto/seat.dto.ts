import { ApiProperty } from '@nestjs/swagger';

// A seat is not a table: it's a (row, seat) pair calculated from the hall.
export class SeatDto {
  @ApiProperty({ example: 1 })
  row: number;

  @ApiProperty({ example: 5 })
  seat: number;
}
