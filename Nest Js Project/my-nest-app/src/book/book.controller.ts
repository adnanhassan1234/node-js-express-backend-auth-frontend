import { Controller, Get, Post, Body, Param, Delete, UseFilters, UseGuards } from '@nestjs/common';
import { BookService } from './book.service';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerExceptionFilter } from 'src/throttler/throttler.filter';

@Controller('books')
export class BookController {
  constructor(private bookService: BookService) {}

  @Post()
  create(@Body() body: { title: string; author: string }) {
    return this.bookService.create(body);
  }

  @Get()
  @UseGuards(ThrottlerGuard)
  @UseFilters(ThrottlerExceptionFilter)
  @Throttle({ default: { limit: 2, ttl: 10000 } })
  findAll() {
    return this.bookService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookService.findOne(Number(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookService.remove(Number(id));
  }
}
