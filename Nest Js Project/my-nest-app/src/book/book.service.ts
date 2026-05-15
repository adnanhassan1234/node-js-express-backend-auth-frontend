import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) {}

  // Create Book
  create(data: { title: string; author: string }) {
    return this.prisma.book.create({
      data,
    });
  }

  // Get All Books
  findAll() {
    return this.prisma.book.findMany();
  }

  // Get Single Book
  findOne(id: number) {
    return this.prisma.book.findUnique({
      where: { id },
    });
  }

  // Delete
  remove(id: number) {
    return this.prisma.book.delete({
      where: { id },
    });
  }
}
