import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEmployee2Dto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Position is required' })
  position: string;

  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  department: string;
}
