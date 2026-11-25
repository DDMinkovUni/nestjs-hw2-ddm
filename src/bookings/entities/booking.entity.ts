import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Showing } from '../../showings/entities/showing.entity.js';
import { BookingSeat } from './booking-seat.entity.js';

// The booking itself: which showing and how much. The seats are NOT here;
// each seat is a separate row in booking_seats (see booking-seat.entity.ts).
@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'showing_id', type: 'uuid' })
  showingId: string;

  @ManyToOne(() => Showing, (showing) => showing.bookings, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'showing_id' })
  showing?: Relation<Showing>;

  @Column({ name: 'total_price', type: 'integer' })
  totalPrice: number;

  // Filled by Postgres (default now()) when the row is inserted.
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => BookingSeat, (seat) => seat.booking)
  seats?: Relation<BookingSeat[]>;
}
