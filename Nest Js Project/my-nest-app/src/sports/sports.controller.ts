import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseFilters,
} from '@nestjs/common';
import { SportsService } from './sports.service';
import { CreateSportDto } from './dto/create-sport.dto';
import { UpdateSportDto } from './dto/update-sport.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response/response.interceptor';
import { HttpExceptionFilter } from 'src/filters/http-exception/http-exception.filter';
import { Sport } from './entities/sport.schema';

@UseInterceptors(ResponseInterceptor)
@UseFilters(HttpExceptionFilter)
@Controller('sports')
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Post()
  create(@Body() data: CreateSportDto) {
    return this.sportsService.create(data);
  }

  @Get()
  findAll() {
    return this.sportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Sport | null> {
    return this.sportsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateSportDto): Promise<Sport | null> {
    return this.sportsService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Sport | null> {
    return this.sportsService.remove(id);
  }
}
