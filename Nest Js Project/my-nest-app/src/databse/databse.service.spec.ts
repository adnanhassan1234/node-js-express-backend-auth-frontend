import { Test, TestingModule } from '@nestjs/testing';
import { DatabseService } from './databse.service';

describe('DatabseService', () => {
  let service: DatabseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabseService],
    }).compile();

    service = module.get<DatabseService>(DatabseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
