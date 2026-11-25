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
  PG_UNIQUE_VIOLATION,
} from '../common/postgres-errors.js';
import { CreateHallDto } from './dto/create-hall.dto.js';
import { HallWithSeatsDto } from './dto/hall-with-seats.dto.js';
import { SeatDto } from './dto/seat.dto.js';
import { Hall } from './entities/hall.entity.js';

@Injectable()
export class HallsService {
  constructor(
    @InjectRepository(Hall)
    private readonly hallsRepository: Repository<Hall>,
  ) {}

  async create(dto: CreateHallDto): Promise<Hall> {
    const hall = this.hallsRepository.create({ ...dto, name: dto.name.trim() });
    try {
      return await this.hallsRepository.save(hall);
    } catch (error) {
      // halls.name is UNIQUE in the database. A duplicate fails with 23505.
      // (Note "return await" above: without await the error would escape
      // this try/catch.)
      if (hasPgCode(error, PG_UNIQUE_VIOLATION)) {
        throw new ConflictException(
          `Hall with name "${hall.name}" already exists`,
        );
      }
      throw error;
    }
  }

  findAll(): Promise<Hall[]> {
    return this.hallsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Hall> {
    const hall = await this.hallsRepository.findOneBy({ id });
    if (!hall) {
      throw new NotFoundException(`Hall with id ${id} not found`);
    }
    return hall;
  }

  findById(id: string): Promise<Hall | null> {
    return this.hallsRepository.findOneBy({ id });
  }

  async findOneWithSeats(id: string): Promise<HallWithSeatsDto> {
    const hall = await this.findOne(id);
    return { ...hall, seats: this.getSeats(hall) };
  }

  // Pure calculation, no database: 3 rows x 5 seats -> 15 {row, seat} pairs.
  getSeats(hall: Hall): SeatDto[] {
    const seats: SeatDto[] = [];
    for (let row = 1; row <= hall.rows; row++) {
      for (let seat = 1; seat <= hall.seatsPerRow; seat++) {
        seats.push({ row, seat });
      }
    }
    return seats;
  }

  hasSeat(hall: Hall, row: number, seat: number): boolean {
    return (
      row >= 1 && row <= hall.rows && seat >= 1 && seat <= hall.seatsPerRow
    );
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    try {
      await this.hallsRepository.delete(id);
    } catch (error) {
      // showings.hall_id is ON DELETE RESTRICT -> 23503 while showings exist.
      if (hasPgCode(error, PG_FOREIGN_KEY_VIOLATION)) {
        throw new ConflictException(
          `Hall ${id} cannot be deleted: it is used by at least one showing`,
        );
      }
      throw error;
    }
  }
}
