import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Showing } from '../../showings/entities/showing.entity.js';

// @Entity('films') = this class is the "films" table.
// Each @Column is a column. `name:` sets the snake_case column name in the
// database while the TypeScript property stays camelCase.
@Entity('films')
export class Film {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid') // default gen_random_uuid()
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  @Column({ type: 'varchar' })
  title: string;

  @ApiProperty({ example: 166, description: 'Length in minutes' })
  @Column({ name: 'duration_minutes', type: 'integer' })
  durationMinutes: number;

  @ApiProperty({ example: 2024 })
  @Column({ name: 'release_year', type: 'integer' })
  releaseYear: number;

  // The "one" side of film -> showings. No column is created for this;
  // it only lets TypeORM load a film's showings if we ever ask for them.
  //
  // Relation<...> matters: with ES modules, film.entity and showing.entity
  // import each other. Relation<> stops TypeScript from emitting
  // "design:type = Showing" metadata, which would crash at startup with
  // "Cannot access 'Showing' before initialization" (same bug as HW1).
  @OneToMany(() => Showing, (showing) => showing.film)
  showings?: Relation<Showing[]>;
}
