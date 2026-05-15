import { Controller, Get, Param, ParseIntPipe, UseFilters } from '@nestjs/common';
import { HttpExceptionFilter } from 'src/filters/http-exception/http-exception.filter';

@Controller('exception')
@UseFilters(HttpExceptionFilter)
export class ExceptionController {
  @Get('hello/:id')
  getException(@Param('id', ParseIntPipe) id: number) {
    return { message: `This is a test exception, id is ${id}` };
  }
}
