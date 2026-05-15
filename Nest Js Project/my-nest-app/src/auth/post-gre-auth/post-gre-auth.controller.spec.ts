import { Test, TestingModule } from '@nestjs/testing';
import { PostGreAuthController } from './post-gre-auth.controller';
import { PostGreAuthService } from './post-gre-auth.service';

describe('PostGreAuthController', () => {
  let controller: PostGreAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostGreAuthController],
      providers: [PostGreAuthService],
    }).compile();

    controller = module.get<PostGreAuthController>(PostGreAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
