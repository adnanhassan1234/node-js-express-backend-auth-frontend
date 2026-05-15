/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuthDto } from './dto/create-register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import sendEmail from 'src/utils/sendEmail';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login-auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly jwtService: JwtService,
  ) {}

  async register(data: CreateAuthDto) {
    const { name, email, password } = data;
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists with this email');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationToken,
      },
    });

    const verifyLink = `http://localhost:3000/auth/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: data.email,
      subject: 'Please verify your email',
      name: data.name,
      verifyLink,
    });

    return user;
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    // const verificationToken = token.split('?token=')[1];
    const user = await this.prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });
  }

  async loginUser(data: LoginDto) {
    const { email, password } = data;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect credentials');
    }

    if (!user.emailVerified) {
      throw new BadRequestException('Email not verified');
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    await this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        refreshToken,
      },
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async forgotPassword(data: ForgotPasswordDto) {
    const { email } = data;
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'If this email exists, a reset link has been sent.',
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { email: data.email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpire: resetTokenExpires,
      },
    });

    const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Reset your password',
      name: user.name,
      verifyLink: resetLink,
    });
  }

  async resetPassword(data: ResetPasswordDto, token: string) {
    const { newPassword, confirmNewPassword } = data;
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });
    return true;
  }
  async refreshToken(data: { refreshToken: string }) {
    const { refreshToken } = data;

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const newPayload = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };

    const accessToken = await this.jwtService.signAsync(newPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Token is invalid or has been revoked');
    }
    await this.jwtService.signAsync(newPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    });

    return {
      accessToken,
      refreshToken,
      user: user,
    };
  }
}
