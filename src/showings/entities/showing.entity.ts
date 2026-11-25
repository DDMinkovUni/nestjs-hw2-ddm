import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity.js';
import { Film } from '../../films/entities/film.entity.js';
import { Hall } from '../../halls/entities/hall.entity.js';

@Entity('showings')
export class Showing {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Two properties for one link, on purpose:
  //   filmId -> the plain film_id column (easy to read and to filter by)
  //   film   -> the relation object, loaded only when we join it
  // Both point at the same column "film_id" (see @JoinColumn below).
  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'film_id', type: 'uuid' })
  filmId: string;

  // nullable: false -> a showing MUST have a film (NOT NULL).
  // onDelete: 'RESTRICT' -> Postgres refuses to delete a film that still has
  // showings. No cascade: deleting a film must never delete its showings.
  @ManyToOne(() => Film, (film) => film.showings, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'film_id' })
  film?: Relation<Film>;

  @ApiProperty({ format: 'uuid' })
  @Column({ name: 'hall_id', type: 'uuid' })
  hallId: string;

  @ManyToOne(() => Hall, (hall) => hall.showings, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'hall_id' })
  hall?: Relation<Hall>;

  // timestamptz = timestamp WITH time zone. Postgres stores it in UTC and
  // TypeORM gives us a JS Date. JSON turns it into "2030-01-15T18:00:00.000Z".
  @ApiProperty({ example: '2030-01-15T18:00:00.000Z', type: String })
  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @ApiProperty({ example: 12500, description: 'Ticket price in kopecks' })
  @Column({ type: 'integer' })
  price: number;

  @OneToMany(() => Booking, (booking) => booking.showing)
  bookings?: Relation<Booking[]>;
}
