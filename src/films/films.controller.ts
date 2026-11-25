import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateFilmDto } from './dto/create-film.dto.js';
import { UpdateFilmDto } from './dto/update-film.dto.js';
import { Film } from './entities/film.entity.js';
import { FilmsService } from './films.service.js';

// The controller stays thin: take the request, call the service,
// return what the service gives back. No business logic lives here.
@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Post()
  @ApiCreatedResponse({ type: Film, description: 'Film created' })
  @ApiBadRequestResponse({
    description: 'A field is missing or has the wrong type',
  })
  create(@Body() dto: CreateFilmDto): Promise<Film> {
    return this.filmsService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: [Film],
    description: 'All films (empty array if none)',
  })
  findAll(): Promise<Film[]> {
    return this.filmsService.findAll();
  }

  // ParseUUIDPipe checks that :id looks like a UUID. If it doesn't, the
  // client gets 400 right away instead of a pointless lookup.
  @Get(':id')
  @ApiOkResponse({ type: Film })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Film not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Film> {
    return this.filmsService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: Film, description: 'Updated film' })
  @ApiBadRequestResponse({
    description: 'A field has the wrong type, or id is not a UUID',
  })
  @ApiNotFoundResponse({ description: 'Film not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFilmDto,
  ): Promise<Film> {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // 204 instead of the default 200
  @ApiNoContentResponse({ description: 'Film deleted' })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Film not found' })
  @ApiConflictResponse({ description: 'At least one showing uses this film' })
  // Must RETURN the promise: without it Nest would answer 204 before the
  // database replies, and a 404/409 thrown later would be lost.
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.filmsService.remove(id);
  }
}
