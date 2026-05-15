import { Test, TestingModule } from '@nestjs/testing';
import { Employee2Controller } from './employee2.controller';
import { Employee2Service } from './employee2.service';

describe('Employee2Controller', () => {
  let controller: Employee2Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Employee2Controller],
      providers: [Employee2Service],
    }).compile();

    controller = module.get<Employee2Controller>(Employee2Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
