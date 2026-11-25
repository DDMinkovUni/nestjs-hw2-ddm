import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { hasPgCode, PG_UNIQUE_VIOLATION } from '../common/postgres-errors.js';
import { HallsService } from '../halls/halls.service.js';
import { ShowingsService } from '../showings/showings.service.js';
import {
  BookingResponseDto,
  SeatStatusDto,
} from './dto/booking-response.dto.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { BookingSeat } from './entities/booking-seat.entity.js';
import { Booking } from './entities/booking.entity.js';

const seatKey = (s: { row: number; seat: number }) => `${s.row}:${s.seat}`;

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(BookingSeat)
    private readonly bookingSeatsRepository: Repository<BookingSeat>,
    // DataSource = the whole database connection. We need it to open a
    // transaction (dataSource.transaction(...)).
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly showingsService: ShowingsService,
    private readonly hallsService: HallsService,
  ) {}

  async findAll(): Promise<BookingResponseDto[]> {
    const bookings = await this.bookingsRepository.find({
      relations: { seats: true },
      order: { createdAt: 'ASC' },
    });
    return bookings.map((b) => this.toResponse(b));
  }

  async findByShowing(showingId: string): Promise<BookingResponseDto[]> {
    await this.showingsService.ensureExists(showingId); // 404
    const bookings = await this.bookingsRepository.find({
      where: { showingId },
      relations: { seats: true },
      order: { createdAt: 'ASC' },
    });
    return bookings.map((b) => this.toResponse(b));
  }

  async create(
    showingId: string,
    dto: CreateBookingDto,
  ): Promise<BookingResponseDto> {
    const showing = await this.showingsService.findWithHall(showingId); // 404
    const hall = showing.hall;

    // 1) Every seat must exist in the hall -> 400. Needs the hall, so it's
    //    the service's job, not the DTO's.
    const outside = dto.seats.filter(
      (s) => !this.hallsService.hasSeat(hall, s.row, s.seat),
    );
    if (outside.length > 0) {
      const list = outside.map((s) => `row ${s.row} seat ${s.seat}`).join(', ');
      throw new BadRequestException(
        `Seats not in hall "${hall.name}" (${hall.rows} rows x ${hall.seatsPerRow} seats): ${list}`,
      );
    }

    // 2) Write the booking and ALL its seats in ONE transaction.
    //
    // There is no "is this seat free?" check before inserting. That check
    // would be useless anyway: two requests could both see the seat as free
    // and both insert. Instead we just INSERT, and the unique index on
    // booking_seats (showing_id, row, seat) rejects a taken seat.
    //
    // The try/catch is AROUND transaction(), not inside it. If we caught the
    // error inside the callback, TypeORM wouldn't see it and would COMMIT
    // half of the work. Letting it escape makes TypeORM ROLLBACK first:
    // no booking row, no seat rows, nothing left behind.
    try {
      return await this.dataSource.transaction(async (manager) => {
        // `manager` is tied to the connection the transaction runs on.
        // Inside the callback, use ONLY manager. this.bookingsRepository
        // would grab a different connection, outside the transaction.
        const booking = manager.create(Booking, {
          showingId,
          totalPrice: showing.price * dto.seats.length, // exact: integers
        });
        await manager.save(booking); // INSERT INTO bookings; Postgres makes the id

        const seats = dto.seats.map((s) =>
          manager.create(BookingSeat, {
            bookingId: booking.id, // only known after the save above
            showingId,
            row: s.row,
            seat: s.seat,
          }),
        );
        await manager.save(seats); // INSERT INTO booking_seats (one per seat)

        booking.seats = seats;
        return this.toResponse(booking);
      }); // callback finished without error -> COMMIT
    } catch (error) {
      if (hasPgCode(error, PG_UNIQUE_VIOLATION)) {
        // Our own message. The Postgres text (with table and index names)
        // must never reach the client.
        throw new ConflictException(
          'One or more of the requested seats are already booked for this showing',
        );
      }
      throw error; // lost connection etc. -> stays a 500
    }
  }

  async getSeatMap(showingId: string): Promise<SeatStatusDto[]> {
    const showing = await this.showingsService.findWithHall(showingId); // 404
    // SELECT row, seat FROM booking_seats WHERE showing_id = ...
    const taken = await this.bookingSeatsRepository.find({
      where: { showingId },
      select: { row: true, seat: true },
    });
    const booked = new Set(taken.map(seatKey));
    return this.hallsService
      .getSeats(showing.hall)
      .map((s) => ({ ...s, isBooked: booked.has(seatKey(s)) }));
  }

  async remove(id: string): Promise<void> {
    // One DELETE. booking_seats.booking_id is ON DELETE CASCADE, so Postgres
    // removes the seat rows itself, and the seats become free.
    const result = await this.bookingsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }
  }

  private toResponse(booking: Booking): BookingResponseDto {
    return {
      id: booking.id,
      showingId: booking.showingId,
      seats: (booking.seats ?? [])
        .map((s) => ({ row: s.row, seat: s.seat }))
        .sort((a, b) => a.row - b.row || a.seat - b.seat),
      totalPrice: booking.totalPrice,
    };
  }
}
