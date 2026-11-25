import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Showing } from '../../showings/entities/showing.entity.js';
import { Booking } from './booking.entity.js';

// One row = one seat taken by one booking on one showing.
//
// THE most important line of the project: a unique index on
// (showing_id, row, seat). Postgres refuses a second row with the same three
// values, even if two requests arrive at the same moment and both "saw" the
// seat as free. That's why showing_id is stored here even though it could be
// reached through booking_id: an index can only use columns of its own table.
@Entity('booking_seats')
@Index('UQ_booking_seats_showing_row_seat', ['showingId', 'row', 'seat'], {
  unique: true,
})
export class BookingSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  // onDelete: 'CASCADE' -> when a booking is deleted, Postgres deletes its
  // seats automatically. The service never loops over seats to delete them.
  @ManyToOne(() => Booking, (booking) => booking.seats, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking?: Relation<Booking>;

  @Column({ name: 'showing_id', type: 'uuid' })
  showingId: string;

  // Only one side: we never need "all seat rows of a showing" via the
  // Showing entity; BookingsService queries booking_seats directly.
  @ManyToOne(() => Showing, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'showing_id' })
  showing?: Relation<Showing>;

  @Column({ type: 'integer' })
  row: number;

  @Column({ type: 'integer' })
  seat: number;
}
