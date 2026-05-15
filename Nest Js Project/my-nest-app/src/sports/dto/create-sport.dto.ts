import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSportDto {
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
