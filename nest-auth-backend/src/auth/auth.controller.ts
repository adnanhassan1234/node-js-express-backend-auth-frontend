import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-register.dto';
import { LoginDto } from './dto/login-auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: CreateAuthDto) {
    const user = await this.authService.register(data);
    return {
      success: true,
      message: `Please check your email (${user.email}) to verify your account!`,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return {
      success: true,
      message: 'Email verified successfully!',
    };
  }

  @Post('login')
  async loginUser(@Body() data: LoginDto) {
    const user = await this.authService.loginUser(data);
    return {
      success: true,
      message: 'Login successful!',
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      role: user.user.role,
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() data: ForgotPasswordDto) {
    await this.authService.forgotPassword(data);
    return {
      success: true,
      message: `please check your email (${data.email}) to reset your password`,
    };
  }

  @Post('reset-password')
  async resetPassword(
    @Body() data: ResetPasswordDto,
    @Query('token') token: string,
  ) {
    await this.authService.resetPassword(data, token);

    return {
      success: true,
      message: 'Password reset successfully!',
    };
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    const result = await this.authService.refreshToken(body);
    return {
      success: true,
      message: 'Token refreshed successfully!',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      role: result.user.role,
    };
  }
}
