import { IsString, IsNumber, Min, Max, IsEmail, IsOptional } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(15)
  @Max(30)
  age: number;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
