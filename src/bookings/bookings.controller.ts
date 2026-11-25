import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import {
  BookingResponseDto,
  SeatStatusDto,
} from './dto/booking-response.dto.js';

// No prefix in @Controller(), because this controller serves URLs under
// both /bookings and /showings/:id/... . The seat map lives here too:
// "which seats are taken" is booking data, and putting it in ShowingsService
// would create another circular dependency (showings <-> bookings).
@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOkResponse({
    type: [BookingResponseDto],
    description: 'All bookings (empty array if none)',
  })
  findAll(): Promise<BookingResponseDto[]> {
    return this.bookingsService.findAll();
  }

  @Post('showings/:id/bookings')
  @ApiCreatedResponse({
    type: BookingResponseDto,
    description: 'Booking created, with totalPrice',
  })
  @ApiBadRequestResponse({
    description:
      'seats is empty; an element misses row/seat; a seat is repeated; ' +
      'a seat is outside the hall or not a positive integer',
  })
  @ApiNotFoundResponse({ description: 'Showing not found' })
  @ApiConflictResponse({
    description: 'At least one seat is already booked; nothing was booked',
  })
  create(
    @Param('id', ParseUUIDPipe) showingId: string,
    @Body() dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(showingId, dto);
  }

  @Get('showings/:id/bookings')
  @ApiOkResponse({ type: [BookingResponseDto] })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Showing not found' })
  findByShowing(
    @Param('id', ParseUUIDPipe) showingId: string,
  ): Promise<BookingResponseDto[]> {
    return this.bookingsService.findByShowing(showingId);
  }

  @Get('showings/:id/seats')
  @ApiTags('showings')
  @ApiOkResponse({
    type: [SeatStatusDto],
    description:
      'Every seat of the hall with isBooked. Length = rows x seatsPerRow',
  })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Showing not found' })
  getSeats(
    @Param('id', ParseUUIDPipe) showingId: string,
  ): Promise<SeatStatusDto[]> {
    return this.bookingsService.getSeatMap(showingId);
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Booking cancelled, its seats are free again',
  })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.bookingsService.remove(id);
  }
}
