import { Module } from '@nestjs/common';
import { Employee2Service } from './employee2.service';
import { Employee2Controller } from './employee2.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee2 } from './entities/employee2.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee2])],
  controllers: [Employee2Controller],
  providers: [Employee2Service],
})
export class Employee2Module {}
