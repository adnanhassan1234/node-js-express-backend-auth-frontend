// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Employee, EmployeeDocument } from './employee.schema';
// import { CreateEmployeeDto } from './dto/create-employee.dto';

// @Injectable()
// export class EmployeeService {
//   constructor(
//     @InjectModel(Employee.name)
//     private readonly employeeModel: Model<EmployeeDocument>,
//   ) {}

//   async getEmployees(query: {
//     page: number;
//     limit: number;
//     name?: string;
//     age?: number;
//     sortField: string;
//     sortOrder: 'asc' | 'desc';
//   }) {
//     try {
//       const { page, limit, name, age, sortField, sortOrder } = query;

//       const filter: Record<string, any> = {};

//       if (name) {
//         filter.name = { $regex: name, $options: 'i' };
//       }
//       if (age) {
//         filter.age = Number(age);
//       }

//       const skip = (page - 1) * limit;
//       const sort: Record<string, 1 | -1> = {
//         [sortField]: sortOrder === 'asc' ? 1 : -1,
//       };

//       const data = await this.employeeModel.find(filter).skip(skip).limit(limit).sort(sort).exec();

//       return {
//         success: true,
//         message: 'Employees fetched successfully',
//         sorting: {
//           field: sortField,
//           order: sortOrder,
//         },
//         pagination: {
//           page,
//           limit,
//           total: data.length * limit,
//         },
//         result: data,
//       };
//     } catch (error) {
//       const err = error as Error;

//       return {
//         success: false,
//         message: 'Employee retrieval failed',
//         errors: err.message,
//       };
//     }
//   }

//   async getEmployeeById(id: string) {
//     try {
//       const data = await this.employeeModel.findById(id).exec();

//       return {
//         success: true,
//         message: 'Employee fetched successfully',
//         data,
//       };
//     } catch (error) {
//       const err = error as Error;

//       return {
//         success: false,
//         message: 'Employee retrieval failed',
//         errors: err.message,
//       };
//     }
//   }

//   async createEmployee(data: CreateEmployeeDto) {
//     try {
//       const newEmployee = new this.employeeModel(data);
//       const result = await newEmployee.save();

//       return {
//         success: true,
//         message: 'Employee created successfully',
//         data: result,
//       };
//     } catch (error) {
//       const err = error as Error;

//       return {
//         success: false,
//         message: 'Employee creation failed',
//         errors: err.message,
//       };
//     }
//   }

//   async updateEmployee(id: string, data: CreateEmployeeDto) {
//     try {
//       const result = await this.employeeModel.findByIdAndUpdate(id, data, { new: true }).exec();

//       return {
//         success: true,
//         message: 'Employee updated successfully',
//         data: result,
//       };
//     } catch (error) {
//       const err = error as Error;

//       return {
//         success: false,
//         message: 'Employee update failed',
//         errors: err.message,
//       };
//     }
//   }

//   async deleteEmployeeById(id: string) {
//     try {
//       await this.employeeModel.findByIdAndDelete(id).exec();

//       return {
//         success: true,
//         message: 'Employee deleted successfully',
//       };
//     } catch (error) {
//       const err = error as Error;

//       return {
//         success: false,
//         message: 'Employee deletion failed',
//         errors: err.message,
//       };
//     }
//   }
// }

import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from './employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
  ) {}

  async getEmployees(query: {
    page: number;
    limit: number;
    name?: string;
    age?: number;
    sortField: string;
    sortOrder: 'asc' | 'desc';
  }) {
    try {
      const { page, limit, name, age, sortField, sortOrder } = query;

      const filter: Record<string, any> = {};

      if (name) {
        filter.name = { $regex: name, $options: 'i' };
      }
      if (age) {
        filter.age = Number(age);
      }

      const skip = (page - 1) * limit;
      const sort: Record<string, 1 | -1> = {
        [sortField]: sortOrder === 'asc' ? 1 : -1,
      };

      const [data, totalRecords] = await Promise.all([
        this.employeeModel.find(filter).skip(skip).limit(limit).sort(sort).exec(),
        this.employeeModel.countDocuments(filter),
      ]);

      return {
        data,
        meta: {
          page,
          limit,
          totalRecords,
          totalPages: Math.ceil(totalRecords / limit),
        },
        sorting: {
          sortField,
          sortOrder,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(err.message);
    }
  }

  async getEmployeeById(id: string): Promise<Employee> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid employee id');
      }

      const employee = await this.employeeModel.findById(id).exec();

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      return employee;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(err.message);
    }
  }

  async createEmployee(data: CreateEmployeeDto): Promise<Employee> {
    try {
      const newEmployee = new this.employeeModel(data);
      return await newEmployee.save();
    } catch (error) {
      const err = error as Error;
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateEmployee(id: string, data: CreateEmployeeDto): Promise<Employee> {
    try {
      const updatedEmployee = await this.employeeModel
        .findByIdAndUpdate(id, data, { new: true })
        .exec();

      if (!updatedEmployee) {
        throw new NotFoundException('Employee not found');
      }
      return updatedEmployee;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteEmployeeById(id: string): Promise<Employee> {
    try {
      const deletedEmployee = await this.employeeModel.findByIdAndDelete(id).exec();

      if (!deletedEmployee) {
        throw new NotFoundException('Employee not found!');
      }

      return deletedEmployee;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      throw new InternalServerErrorException(err.message);
    }
  }
}
