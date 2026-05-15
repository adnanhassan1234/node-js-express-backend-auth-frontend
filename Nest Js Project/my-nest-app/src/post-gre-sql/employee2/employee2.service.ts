import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateEmployee2Dto } from './dto/create-employee2.dto';
import { UpdateEmployee2Dto } from './dto/update-employee2.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee2 } from './entities/employee2.entity';
import { Repository } from 'typeorm';

@Injectable()
export class Employee2Service {
  constructor(
    @InjectRepository(Employee2)
    private readonly employeeRepository: Repository<Employee2>,
  ) {}

  async createEmployee2(data: CreateEmployee2Dto): Promise<Employee2> {
    try {
      const newEmployee = this.employeeRepository.create(data);
      return await this.employeeRepository.save(newEmployee);
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(err.message);
    }
  }

  findAll() {
    return `This action returns all employee2`;
  }

  findOne(id: number) {
    return `This action returns a #${id} employee2`;
  }

  async update(id: number, data: UpdateEmployee2Dto) {
    const employee = await this.employeeRepository.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    Object.assign(employee, data);

    return this.employeeRepository.save(employee);
  }
  // createQueryBuilder filter
  async findAllQuery(name?: string, department?: string) {
    const query = this.employeeRepository.createQueryBuilder('Employee2');

    if (name) {
      query.andWhere('Employee2.name ILIKE :name', {
        name: `%${name}%`,
      });
    }

    if (department) {
      query.andWhere('LOWER(Employee2.department) = LOWER(:dept)', {
        dept: department,
      });
    }

    return await query.getMany();
  }

  remove(id: number) {
    return `This action removes a #${id} employee2`;
  }
}
