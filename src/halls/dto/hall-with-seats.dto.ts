import { ApiProperty } from '@nestjs/swagger';
import { Hall } from '../entities/hall.entity.js';
import { SeatDto } from './seat.dto.js';

// Response of GET /halls/:id: the hall columns plus the calculated seats.
export class HallWithSeatsDto extends Hall {
  @ApiProperty({ type: [SeatDto] })
  seats: SeatDto[];
}
