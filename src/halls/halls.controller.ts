import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { CreateHallDto } from './dto/create-hall.dto.js';
import { HallWithSeatsDto } from './dto/hall-with-seats.dto.js';
import { Hall } from './entities/hall.entity.js';
import { HallsService } from './halls.service.js';

@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Post()
  @ApiCreatedResponse({ type: Hall, description: 'Hall created' })
  @ApiBadRequestResponse({
    description:
      'A field is missing, has the wrong type, or is not a positive integer',
  })
  @ApiConflictResponse({ description: 'A hall with this name already exists' })
  create(@Body() dto: CreateHallDto): Promise<Hall> {
    return this.hallsService.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [Hall] })
  findAll(): Promise<Hall[]> {
    return this.hallsService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    type: HallWithSeatsDto,
    description: 'Hall with its list of seats',
  })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Hall not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<HallWithSeatsDto> {
    return this.hallsService.findOneWithSeats(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Hall deleted' })
  @ApiBadRequestResponse({ description: 'id is not a valid UUID' })
  @ApiNotFoundResponse({ description: 'Hall not found' })
  @ApiConflictResponse({ description: 'At least one showing uses this hall' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.hallsService.remove(id);
  }
}
