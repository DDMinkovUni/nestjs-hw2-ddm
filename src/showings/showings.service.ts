import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilmsService } from '../films/films.service.js';
import { HallsService } from '../halls/halls.service.js';
import { CreateShowingDto } from './dto/create-showing.dto.js';
import { PaginatedShowingsDto } from './dto/paginated-showings.dto.js';
import { ShowingViewDto } from './dto/showing-view.dto.js';
import { ShowingsQueryDto } from './dto/showings-query.dto.js';
import { Showing } from './entities/showing.entity.js';

@Injectable()
export class ShowingsService {
  // No forwardRef any more: films and halls don't call ShowingsService now
  // (the database refuses those deletes by itself), so there's no circle.
  constructor(
    @InjectRepository(Showing)
    private readonly showingsRepository: Repository<Showing>,
    private readonly filmsService: FilmsService,
    private readonly hallsService: HallsService,
  ) {}

  async create(dto: CreateShowingDto): Promise<Showing> {
    // Same rule as HW1: unknown film/hall in the BODY is 400, not 404.
    if (!(await this.filmsService.findById(dto.filmId))) {
      throw new BadRequestException(`Film with id ${dto.filmId} not found`);
    }
    if (!(await this.hallsService.findById(dto.hallId))) {
      throw new BadRequestException(`Hall with id ${dto.hallId} not found`);
    }
    const showing = this.showingsRepository.create({
      filmId: dto.filmId,
      hallId: dto.hallId,
      startsAt: new Date(dto.startsAt),
      price: dto.price,
    });
    return this.showingsRepository.save(showing);
  }

  // Filtering, sorting and paging all happen in ONE SQL query.
  // We never load every showing and cut the array in JS.
  async findAll(query: ShowingsQueryDto): Promise<PaginatedShowingsDto> {
    const { filmId, date, page, limit, sort } = query;

    // 'showing' is the alias for the showings table in the generated SQL.
    const qb = this.showingsRepository
      .createQueryBuilder('showing')
      // JOIN films and halls so we get the title and name in the same query.
      .innerJoinAndSelect('showing.film', 'film')
      .innerJoinAndSelect('showing.hall', 'hall');

    if (filmId) {
      // :filmId is a parameter. Never glue values into SQL strings yourself;
      // parameters are what protect against SQL injection.
      qb.andWhere('showing.filmId = :filmId', { filmId });
    }

    if (date) {
      // "Starts on 2030-01-15" = from 2030-01-15 00:00 (incl.) to
      // 2030-01-16 00:00 (excl.), UTC. A range like this can use an index
      // on starts_at; wrapping the column in a function couldn't.
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const nextDay = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      qb.andWhere('showing.startsAt >= :dayStart', { dayStart });
      qb.andWhere('showing.startsAt < :nextDay', { nextDay });
    }

    qb.orderBy('showing.startsAt', sort === 'desc' ? 'DESC' : 'ASC')
      // Same start time -> by id, so the order is stable between pages.
      .addOrderBy('showing.id', 'ASC')
      .skip((page - 1) * limit) // OFFSET
      .take(limit); // LIMIT

    // Two queries: the rows of this page, and COUNT(*) of all matches
    // (same filters, ignoring skip/take). That's what "total" needs.
    const [showings, total] = await qb.getManyAndCount();

    return {
      items: showings.map((s) => this.toView(s)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ShowingViewDto> {
    const showing = await this.showingsRepository.findOne({
      where: { id },
      relations: { film: true, hall: true },
    });
    if (!showing) {
      throw new NotFoundException(`Showing with id ${id} not found`);
    }
    return this.toView(showing);
  }

  // For the bookings module: the showing with its hall (needed for the seat
  // layout), or 404.
  async findWithHall(
    id: string,
  ): Promise<Showing & { hall: NonNullable<Showing['hall']> }> {
    const showing = await this.showingsRepository.findOne({
      where: { id },
      relations: { hall: true },
    });
    if (!showing || !showing.hall) {
      throw new NotFoundException(`Showing with id ${id} not found`);
    }
    return showing as Showing & { hall: NonNullable<Showing['hall']> };
  }

  // Cheap existence check (404) without loading relations.
  async ensureExists(id: string): Promise<void> {
    const exists = await this.showingsRepository.existsBy({ id });
    if (!exists) {
      throw new NotFoundException(`Showing with id ${id} not found`);
    }
  }

  private toView(showing: Showing): ShowingViewDto {
    return {
      id: showing.id,
      filmTitle: showing.film!.title,
      hallName: showing.hall!.name,
      startsAt: showing.startsAt.toISOString(),
      price: showing.price,
    };
  }
}
