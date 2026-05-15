import { Test, TestingModule } from '@nestjs/testing';
import { PostGreAuthService } from './post-gre-auth.service';

describe('PostGreAuthService', () => {
  let service: PostGreAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostGreAuthService],
    }).compile();

    service = module.get<PostGreAuthService>(PostGreAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
