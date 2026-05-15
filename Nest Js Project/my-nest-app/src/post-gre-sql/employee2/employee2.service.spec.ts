import { Test, TestingModule } from '@nestjs/testing';
import { Employee2Service } from './employee2.service';

describe('Employee2Service', () => {
  let service: Employee2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Employee2Service],
    }).compile();

    service = module.get<Employee2Service>(Employee2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
