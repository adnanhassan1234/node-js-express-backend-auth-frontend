import { PartialType } from '@nestjs/mapped-types';
import { CreateSportsDto } from './create-sports.dto';

export class UpdateSportsDto extends PartialType(CreateSportsDto) {}
