import { PartialType } from '@nestjs/mapped-types';
import { CreatePostgreUserDto } from './create-postgre-user.dto';

export class UpdatePostgreUserDto extends PartialType(CreatePostgreUserDto) {}
