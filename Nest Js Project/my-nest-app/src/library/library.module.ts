import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { Library, LibrarySchema } from './schemas/library.schema';
import { Book, BookSchema } from './schemas/book.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Library.name, schema: LibrarySchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
