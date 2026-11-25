import { ApiProperty } from '@nestjs/swagger';
import { SeatDto } from '../../halls/dto/seat.dto.js';

// What the API returns for a booking. Same shape as in HW1:
// in the database the seats live in booking_seats (one row each),
// but the client still gets a simple "seats" array.
export class BookingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  showingId: string;

  @ApiProperty({ type: [SeatDto] })
  seats: SeatDto[];

  @ApiProperty({
    example: 25000,
    description: 'showing price x number of seats, in kopecks',
  })
  totalPrice: number;
}

// One element of GET /showings/:id/seats
export class SeatStatusDto extends SeatDto {
  @ApiProperty({ example: false })
  isBooked: boolean;
}
