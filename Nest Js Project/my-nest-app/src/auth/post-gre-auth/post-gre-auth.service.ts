import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = await this.userModel.create({
        email,
        password: hashedPassword,
      });

      // const result = newUser.toObject();
      // delete result.password;
      return newUser;
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('User not found');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const payload = { email: user.email, sub: user._id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async allUsers() {
    return 'hello my all users';
  }
}
