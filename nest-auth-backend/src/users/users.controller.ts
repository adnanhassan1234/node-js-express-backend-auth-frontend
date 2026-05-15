/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from 'src/role/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/role/roles.decorator';
// import { AuthGuard } from '@nestjs/passport';
// import { UseGuards } from '@nestjs/common';
// import { SupabaseAuthGuard } from 'src/auth/supabse-auth/supabase-auth.guard';

// @UseGuards(SupabaseAuthGuard)
// @UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get()
  async findAll() {
    const data = await this.usersService.findAll();
    return {
      success: true,
      message: 'Record found successfully',
      data,
    };
  }

  @Get('/find')
  @Roles('user')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async findOne(@Query() query: { role: string; name: string }) {
    const data = await this.usersService.findusers(query);
    return {
      success: true,
      message: 'Record found successfully',
      data,
    };
  }

  //   @Delete(':id')
  //   remove(@Param('id') id: string) {
  //     return this.authService.remove(+id);
  //   }
}
