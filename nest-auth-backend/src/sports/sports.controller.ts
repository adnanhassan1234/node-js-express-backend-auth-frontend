/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateSportsDto } from './dto/create-sports.dto';
import { UpdateSportsDto } from './dto/update-sports.dto';
import { SportsService } from './sports.service';

@Controller('sports')
export class SportsController {
  constructor(private readonly sportsService: SportsService) {}

  @Post()
  async create(@Body() createSportsDto: CreateSportsDto) {
    const data = await this.sportsService.create(createSportsDto);

    return {
      success: true,
      message: 'Player created successfully',
      data,
    };
  }

  @Get()
  async findAll() {
    const data = await this.sportsService.findAll();

    return {
      success: true,
      message: 'Players found successfully',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.sportsService.findOne(id);

    return {
      success: true,
      message: 'Player found successfully',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSportsDto: UpdateSportsDto,
  ) {
    const data = await this.sportsService.update(id, updateSportsDto);

    return {
      success: true,
      message: 'Player updated successfully',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.sportsService.remove(id);

    return {
      success: true,
      message: 'Player deleted successfully',
      data,
    };
  }
}
