import { PartialType } from '@nestjs/mapped-types';
import { CreatePostGreAuthDto } from './create-post-gre-auth.dto';

export class UpdatePostGreAuthDto extends PartialType(CreatePostGreAuthDto) {}
