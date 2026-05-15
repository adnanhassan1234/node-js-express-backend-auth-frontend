/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './post-gre-auth.service';
import { AuthGuard } from '@nestjs/passport';
import { CustomAuthGuard } from './customAuthGuard';

@Controller('auth')
export class AuthController {
  constructor(private readonly AuthService: AuthService) {}

  @Post('signUp')
  signUp(@Body() data: { email: string; password: string }) {
    return this.AuthService.signup(data.email, data.password);
  }

  @Post('login')
  login(@Body() data: { email: string; password: string }) {
    return this.AuthService.login(data.email, data.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(CustomAuthGuard)
  @Get('people')
  getUsers() {
    return this.AuthService.allUsers();
  }
}
