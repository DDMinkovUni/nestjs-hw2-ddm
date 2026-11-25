import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Showing } from '../../showings/entities/showing.entity.js';

// The list of seats is NOT stored. It's calculated from rows x seatsPerRow.
@Entity('halls')
export class Hall {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Red hall', description: 'Unique across all halls' })
  // unique: true -> the database itself refuses a second hall with this name
  @Column({ type: 'varchar', unique: true })
  name: string;

  @ApiProperty({ example: 3 })
  @Column({ type: 'integer' })
  rows: number;

  @ApiProperty({ example: 5 })
  @Column({ name: 'seats_per_row', type: 'integer' })
  seatsPerRow: number;

  @OneToMany(() => Showing, (showing) => showing.hall)
  showings?: Relation<Showing[]>;
}
