import { Test, TestingModule } from '@nestjs/testing';
import { DatabseController } from './databse.controller';

describe('DatabseController', () => {
  let controller: DatabseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabseController],
    }).compile();

    controller = module.get<DatabseController>(DatabseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
