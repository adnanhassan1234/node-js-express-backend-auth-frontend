import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(8)
  phone: string;
}
