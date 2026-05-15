import { Controller, Get, Post } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { UserService } from './user.service';

@Controller('user') // Decorator
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(): Promise<User> {
    return this.userService.createUser();
  }

  @Get()
  getAllUsers(): Promise<User[]> {
    return this.userService.findAllUser();
  }

  @Post('relation')
  createUserRelation() {
    return this.userService.createUserRelation();
  }

  @Get('relation')
  getUserRelation() {
    return this.userService.getUserRelation();
  }
}
