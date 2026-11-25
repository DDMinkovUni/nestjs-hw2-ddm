import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

// Query string of GET /showings, e.g.
//   /showings?filmId=...&date=2030-01-15&page=2&limit=10&sort=desc
// Swagger reads these @ApiPropertyOptional decorators and lists every
// parameter on the route's page in /docs.
export class ShowingsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Only showings of this film',
  })
  @IsOptional()
  @IsUUID()
  filmId?: string;

  @ApiPropertyOptional({
    example: '2030-01-15',
    description: 'Only showings that start on this day (YYYY-MM-DD, UTC)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in format YYYY-MM-DD',
  })
  @IsISO8601({ strict: true }, { message: 'date must be a real calendar date' })
  date?: string;

  // Everything in a query string is text: "2" not 2.
  // @Type(() => Number) converts it; then "abc" becomes NaN and "1.5" stays
  // 1.5, so @IsInt rejects both with 400.
  // "= 1" is the default when the parameter is absent.
  @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    enum: SORT_ORDERS,
    default: 'asc',
    description: 'Order by start time',
  })
  @IsOptional()
  @IsIn(SORT_ORDERS, { message: 'sort must be one of: asc, desc' })
  sort: SortOrder = 'asc';
}
