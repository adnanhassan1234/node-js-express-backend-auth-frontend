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
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentService } from './student.service';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    const data = await this.studentService.create(createStudentDto);

    return {
      success: true,
      message: 'Student created successfully',
      data,
    };
  }

  @Get()
  async findAll() {
    const data = await this.studentService.findAll();

    return {
      success: true,
      message: 'Students found successfully',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.studentService.findOne(id);

    return {
      success: true,
      message: 'Student found successfully',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    const data = await this.studentService.update(id, updateStudentDto);

    return {
      success: true,
      message: 'Student updated successfully',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const data = await this.studentService.remove(id);

    return {
      success: true,
      message: 'Student deleted successfully',
      data,
    };
  }
}
