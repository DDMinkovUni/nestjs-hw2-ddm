import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  hasPgCode,
  PG_FOREIGN_KEY_VIOLATION,
} from '../common/postgres-errors.js';
import { CreateFilmDto } from './dto/create-film.dto.js';
import { UpdateFilmDto } from './dto/update-film.dto.js';
import { Film } from './entities/film.entity.js';

@Injectable()
export class FilmsService {
  // The array from HW1 is gone. A Repository<Film> is "the films table":
  // find, save, delete... each method becomes an SQL query.
  // It's available because FilmsModule has TypeOrmModule.forFeature([Film]).
  constructor(
    @InjectRepository(Film)
    private readonly filmsRepository: Repository<Film>,
  ) {}

  // Everything is async now: talking to the database takes time,
  // so each method returns a Promise and callers use await.
  create(dto: CreateFilmDto): Promise<Film> {
    // create() only builds the object; save() runs INSERT and fills in the id.
    const film = this.filmsRepository.create(dto);
    return this.filmsRepository.save(film);
  }

  findAll(): Promise<Film[]> {
    return this.filmsRepository.find({ order: { title: 'ASC' } });
  }

  async findOne(id: string): Promise<Film> {
    const film = await this.filmsRepository.findOneBy({ id });
    if (!film) {
      throw new NotFoundException(`Film with id ${id} not found`);
    }
    return film;
  }

  // For other modules: returns null instead of throwing 404.
  // ShowingsService needs that because a missing film there is a 400.
  findById(id: string): Promise<Film | null> {
    return this.filmsRepository.findOneBy({ id });
  }

  async update(id: string, dto: UpdateFilmDto): Promise<Film> {
    const film = await this.findOne(id);
    this.filmsRepository.merge(film, dto); // copy the sent fields onto it
    return this.filmsRepository.save(film); // UPDATE
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // 404 if missing
    try {
      await this.filmsRepository.delete(id);
    } catch (error) {
      // showings.film_id has ON DELETE RESTRICT, so Postgres itself refuses
      // to delete a film that still has showings (error 23503).
      // We don't check with a separate query: the database is the single
      // source of truth, and it also covers a showing created a millisecond ago.
      if (hasPgCode(error, PG_FOREIGN_KEY_VIOLATION)) {
        throw new ConflictException(
          `Film ${id} cannot be deleted: it is used by at least one showing`,
        );
      }
      throw error; // anything else is a real server error
    }
  }
}
