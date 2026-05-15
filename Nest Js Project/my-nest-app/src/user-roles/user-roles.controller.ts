import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from 'src/guards/roles/role.enum';
import { Roles } from 'src/guards/roles/roles.decorator';
import { RolesGuard } from 'src/guards/roles/roles.guard';

@Controller('user-roles')
export class UserRolesController {
  @Get('admin-data')
  @UseGuards(RolesGuard)
  @Roles(Role.admin)
  getAdminData() {
    return { message: 'Admin Data access granted ' };
  }

  @Get('user-data')
  getUserData() {
    return { message: 'anyone Data access granted ' };
  }
}
