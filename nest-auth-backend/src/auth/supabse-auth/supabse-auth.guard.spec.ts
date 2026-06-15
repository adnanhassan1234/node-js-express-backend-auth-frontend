import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SupabaseAuthGuard } from './supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  it('should be defined', () => {
    expect(
      new SupabaseAuthGuard({} as ConfigService, {} as JwtService),
    ).toBeDefined();
  });
});
