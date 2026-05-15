import { PartialType } from '@nestjs/mapped-types';
import { CreateSportDto } from './create-sport.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSportDto extends PartialType(CreateSportDto) {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string;
  @IsNotEmpty()
  @IsString()
  description: string;
}
