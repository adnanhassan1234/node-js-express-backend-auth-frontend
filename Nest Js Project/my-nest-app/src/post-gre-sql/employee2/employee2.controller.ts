import { Controller, Get, Post, Body, Param, Delete, Put, Query, UseGuards } from '@nestjs/common';
import { Employee2Service } from './employee2.service';
import { CreateEmployee2Dto } from './dto/create-employee2.dto';
import { UpdateEmployee2Dto } from './dto/update-employee2.dto';
import { SupabaseAuthGuard } from 'src/auth/supabase-auth/supabase-auth.guard';

@Controller('employee2')
export class Employee2Controller {
  constructor(private readonly employee2Service: Employee2Service) {}

  @Post()
  async create(@Body() data: CreateEmployee2Dto) {
    const newEmploye = await this.employee2Service.createEmployee2(data);

    return {
      message: 'Add Employee successfully!',
      data: newEmploye,
    };
  }

  @Get()
  findAll() {
    return this.employee2Service.findAll();
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('search')
  findAllQuery(@Query('name') name?: string, @Query('department') department?: string) {
    return this.employee2Service.findAllQuery(name, department);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employee2Service.findOne(+id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateEmployee2Dto) {
    const newEmploye = await this.employee2Service.update(+id, data);
    return {
      message: 'Updated Employee successfully!',
      data: newEmploye,
    };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employee2Service.remove(+id);
  }
}
