import { Test, TestingModule } from '@nestjs/testing';
import { PostgreUserController } from './postgre-user.controller';
import { PostgreUserService } from './postgre-user.service';

describe('PostgreUserController', () => {
  let controller: PostgreUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostgreUserController],
      providers: [PostgreUserService],
    }).compile();

    controller = module.get<PostgreUserController>(PostgreUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
