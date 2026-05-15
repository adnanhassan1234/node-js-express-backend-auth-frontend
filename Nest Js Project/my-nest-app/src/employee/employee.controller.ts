// import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
// import { EmployeeService } from './employee.service';
// import { CreateEmployeeDto } from './dto/create-employee.dto';

// @Controller('employee')
// export class EmployeeController {
//   constructor(private readonly employeeService: EmployeeService) {}

//   @Get()
//   async getAll(
//     @Query('page') page = '1',
//     @Query('limit') limit = '10',
//     @Query('name') name?: string,
//     @Query('age') age?: string,
//     @Query('sortField') sortField = 'createdAt',
//     @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
//   ) {
//     return this.employeeService.getEmployees({
//       page: Number(page),
//       limit: Number(limit),
//       name,
//       age: Number(age),
//       sortField,
//       sortOrder,
//     });
//   }

//   @Get(':id')
//   async getEmployeeById(@Param('id') id: string) {
//     return this.employeeService.getEmployeeById(id);
//   }

//   @Post()
//   async addEmployee(@Body() data: CreateEmployeeDto) {
//     return this.employeeService.createEmployee(data);
//   }

//   @Put(':id')
//   async updateEmployee(@Param('id') id: string, @Body() data: CreateEmployeeDto) {
//     return this.employeeService.updateEmployee(id, data);
//   }

//   @Delete(':id')
//   async deleteEmployeeById(@Param('id') id: string) {
//     return this.employeeService.deleteEmployeeById(id);
//   }
// }

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeService } from './employee.service';
import { HttpExceptionFilter } from 'src/filters/http-exception/http-exception.filter';
import { ResponseInterceptor } from 'src/common/interceptors/response/response.interceptor';

// @UseInterceptors(ResponseInterceptor)
@UseFilters(HttpExceptionFilter)
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  async getAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('name') name?: string,
    @Query('age') age?: string,
    @Query('sortField') sortField = 'createdAt',
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const result = await this.employeeService.getEmployees({
      page: Number(page),
      limit: Number(limit),
      name,
      age: Number(age),
      sortField,
      sortOrder,
    });

    return {
      success: true,
      message: 'Employees fetched successfully',
      sorting: result.sorting,
      pagination: result.meta,
      result: result.data,
    };
  }

  @Get(':id')
  @UseInterceptors(ResponseInterceptor)
  async getEmployeeById(@Param('id') id: string) {
    return await this.employeeService.getEmployeeById(id);
  }

  @Post()
  @UseInterceptors(ResponseInterceptor)
  async addEmployee(@Body() data: CreateEmployeeDto) {
    const result = await this.employeeService.createEmployee(data);
    return result;
  }

  @Put(':id')
  @UseInterceptors(ResponseInterceptor)
  async updateEmployee(@Param('id') id: string, @Body() data: CreateEmployeeDto) {
    const result = await this.employeeService.updateEmployee(id, data);

    return {
      message: 'Employee updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @UseInterceptors(ResponseInterceptor)
  async deleteEmployeeById(@Param('id') id: string) {
    const result = await this.employeeService.deleteEmployeeById(id);

    return {
      message: 'Employee deleted successfully',
      data: result,
    };
  }
}
