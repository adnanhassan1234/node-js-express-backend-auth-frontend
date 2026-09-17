import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSportsDto {
  @IsString()
  @IsNotEmpty()
  playerName: string;

  @IsString()
  @IsNotEmpty()
  jerseyNumber: string;

  @IsString()
  @IsNotEmpty()
  sport: string;

  @IsString()
  @IsOptional()
  team?: string;

  @IsString()
  @IsOptional()
  position?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsInt()
  @Min(1)
  age: number;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  ranking?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  matchesPlayed?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  wins?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  losses?: number;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsIn(['active', 'inactive', 'injured', 'retired'])
  @IsOptional()
  status?: string;
}
