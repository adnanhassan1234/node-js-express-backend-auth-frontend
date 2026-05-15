import { Module } from '@nestjs/common';
import { User, UserSchema } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AddressTwo, AddressTwoSchema } from './schemas/addressTwo.schema';
import { Profile, ProfileSchema } from './schemas/profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AddressTwo.name, schema: AddressTwoSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
