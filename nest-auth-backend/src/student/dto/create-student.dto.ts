import { IsEmail, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  rollNo: string;

  @IsInt()
  @Min(1)
  age: number;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsEmail()
  email: string;
}
