import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployee2Dto } from './create-employee2.dto';

export class UpdateEmployee2Dto extends PartialType(CreateEmployee2Dto) {}
