import { ApiProperty } from '@nestjs/swagger';
import { ShowingViewDto } from './showing-view.dto.js';

// Response of GET /showings: one page of results plus paging info.
export class PaginatedShowingsDto {
  @ApiProperty({ type: [ShowingViewDto], description: 'Showings on this page' })
  items: ShowingViewDto[];

  @ApiProperty({
    example: 42,
    description: 'How many showings match the filters in total (all pages)',
  })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 20, description: 'Page size' })
  limit: number;
}
