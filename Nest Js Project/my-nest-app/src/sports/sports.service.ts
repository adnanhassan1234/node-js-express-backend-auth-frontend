import { Injectable } from '@nestjs/common';
import { CreateSportDto } from './dto/create-sport.dto';
import { UpdateSportDto } from './dto/update-sport.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Sport, SportDocument } from './entities/sport.schema';
import { Model } from 'mongoose';

@Injectable()
export class SportsService {
  constructor(@InjectModel(Sport.name) private readonly sportModel: Model<SportDocument>) {}

  create(data: CreateSportDto) {
    const sport = new this.sportModel(data as Sport);
    return sport.save();
  }

  findAll(): Promise<Sport[]> {
    return this.sportModel.find();
  }

  findOne(id: string): Promise<Sport | null> {
    return this.sportModel.findById(id);
  }

  update(id: string, data: UpdateSportDto): Promise<Sport | null> {
    return this.sportModel.findByIdAndUpdate(id, data);
  }

  remove(id: string): Promise<Sport | null> {
    return this.sportModel.findByIdAndDelete(id);
  }
}
