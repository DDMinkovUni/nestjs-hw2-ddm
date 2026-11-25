import { PartialType } from '@nestjs/swagger';
import { CreateFilmDto } from './create-film.dto.js';

// PartialType copies CreateFilmDto but makes every field optional.
// The validation rules still apply to whichever fields are sent.
// It's imported from @nestjs/swagger (not @nestjs/mapped-types) so the
// Swagger page also shows the fields as optional.
export class UpdateFilmDto extends PartialType(CreateFilmDto) {}
