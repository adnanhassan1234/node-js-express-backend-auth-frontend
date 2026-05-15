import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostgreUserService } from './postgre-user.service';
import { CreatePostgreUserDto } from './dto/create-postgre-user.dto';
import { UpdatePostgreUserDto } from './dto/update-postgre-user.dto';

@Controller('postgre-user')
export class PostgreUserController {
  constructor(private readonly postgreUserService: PostgreUserService) {}

  @Post()
  create(@Body() createPostgreUserDto: CreatePostgreUserDto) {
    return this.postgreUserService.create(createPostgreUserDto);
  }

  @Get()
  findAll() {
    return this.postgreUserService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postgreUserService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostgreUserDto: UpdatePostgreUserDto) {
    return this.postgreUserService.update(+id, updatePostgreUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postgreUserService.remove(+id);
  }
}
