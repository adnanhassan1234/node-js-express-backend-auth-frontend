import { Injectable } from '@nestjs/common';
import { CreatePostgreUserDto } from './dto/create-postgre-user.dto';
import { UpdatePostgreUserDto } from './dto/update-postgre-user.dto';

@Injectable()
export class PostgreUserService {
  create(createPostgreUserDto: CreatePostgreUserDto) {
    return 'This actionss adds a new postgreUser';
  }

  findAll() {
    return `This action returns all postgreUser`;
  }

  findOne(id: number) {
    return `This action returns a #${id} postgreUser`;
  }

  update(id: number, updatePostgreUserDto: UpdatePostgreUserDto) {
    return `This action updates a #${id} postgreUser`;
  }

  remove(id: number) {
    return `This action removes a #${id} postgreUser`;
  }
}
