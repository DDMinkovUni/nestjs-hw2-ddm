import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateShowingDto } from './dto/create-showing.dto.js';
import { PaginatedShowingsDto } from './dto/paginated-showings.dto.js';
import { ShowingViewDto } from './dto/showing-view.dto.js';
import { ShowingsQueryDto } from './dto/showings-query.dto.js';
import { Showing } from './entities/showing.entity.js';
import { ShowingsService } from './showings.service.js';

@ApiTags('showings')
@Controller('showings')
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Post()
  @ApiCreatedResponse({ type: Showing, description: 'Showing created' })
  @ApiBadRequestResponse({
    description:
      'Film or hall not found; startsAt is not a valid ISO 8601 date or is in the past; ' +
      'price is not a positive integer. The message says which.',
  })
  create(@Body() dto: CreateShowingDto): Promise<Showing> {
    return this.showingsService.create(dto);
  }

  // The query parameters (filmId, date, page, limit, sort) are listed in
  // Swagger automatically from ShowingsQueryDto's decorators.
  @Get()
  @ApiOkResponse({
    type: PaginatedShowingsDto,
    description:
      'One page of showings, sorted by start time (then id). ' +
      'Each item has the film title and hall name instead of ids.',
  })
  @ApiBadRequestResponse({
    description:
      'page/limit is not an integer or out of range (page >= 1, 1 <= limit <= 100); ' +
      'date is not YYYY-MM-DD; sort is not asc/desc',
  })
  findAll(@Query() query: ShowingsQueryDto): Promise<PaginatedShowingsDto> {
    return this.showingsService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ShowingViewDto })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Showing not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ShowingViewDto> {
    return this.showingsService.findOne(id);
  }
}
