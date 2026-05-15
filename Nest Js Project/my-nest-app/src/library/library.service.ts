import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { Book } from './schemas/book.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Library } from './schemas/library.schema';

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(Library.name) private libraryModel: Model<Library>,
    @InjectModel(Book.name) private bookModel: Model<Book>,
  ) {}

  async createBookForLibrary(): Promise<Library> {
    const b1 = new this.bookModel({ title: 'Book 1', author: 'Author 1' });
    const b2 = new this.bookModel({ title: 'Book 2', author: 'Author 2' });
    const b3 = new this.bookModel({ title: 'Book 3', author: 'Author 3' });

    await Promise.all([b1.save(), b2.save(), b3.save()]);

    const newLibrary = new this.libraryModel({
      name: 'QNH Library 1',
      books: [b1._id, b2._id, b3._id],
    });

    return newLibrary.save();
  }

  async findAllLibrary(): Promise<Library[]> {
    return this.libraryModel.find().populate('books').exec();
  }
}
