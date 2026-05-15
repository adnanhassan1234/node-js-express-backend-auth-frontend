import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AddressTwo, AddressTwoDocument } from './schemas/addressTwo.schema';
import { Profile, ProfileDocument } from './schemas/profile.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(AddressTwo.name)
    private readonly addressTwoModel: Model<AddressTwoDocument>,

    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
  ) {}

  async createUser(): Promise<User> {
    const user = new this.userModel({
      name: 'QMH',
      email: 'qmh@example.com',
      address: {
        city: 'New York',
        street: 'Main St',
        country: 'USA',
      },
    });
    return user.save();
  }

  async findAllUser(): Promise<User[]> {
    return this.userModel.find();
  }
  async createUserRelation() {
    const address = await this.addressTwoModel.create({
      city: 'New York',
      country: 'USA',
    });

    const user = new this.profileModel({
      name: 'QMH 555',
      addressTwo: address._id,
    });

    return await user.save();
  }

  async getUserRelation() {
    return this.profileModel.find().populate('address').exec();
  }
}
