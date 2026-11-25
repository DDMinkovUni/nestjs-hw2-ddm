import { ApiProperty } from '@nestjs/swagger';

// One showing as GET /showings and GET /showings/:id return it:
// the film title and hall name instead of their ids.
export class ShowingViewDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  filmTitle: string;

  @ApiProperty({ example: 'Red hall' })
  hallName: string;

  @ApiProperty({ example: '2030-01-15T18:00:00.000Z' })
  startsAt: string;

  @ApiProperty({ example: 12500, description: 'Kopecks' })
  price: number;
}
