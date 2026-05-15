import { Test, TestingModule } from '@nestjs/testing';
import { PostgreUserService } from './postgre-user.service';

describe('PostgreUserService', () => {
  let service: PostgreUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostgreUserService],
    }).compile();

    service = module.get<PostgreUserService>(PostgreUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
