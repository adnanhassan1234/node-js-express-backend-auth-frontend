import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createStudentDto: CreateStudentDto) {
    try {
      return await this.prismaService.student.create({
        data: createStudentDto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  findAll() {
    return this.prismaService.student.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const student = await this.prismaService.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${id} not found`);
    }

    return student;
  }

  async update(id: number, updateStudentDto: UpdateStudentDto) {
    await this.findOne(id);

    try {
      return await this.prismaService.student.update({
        where: { id },
        data: updateStudentDto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaService.student.delete({
      where: { id },
    });
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      // eslint-disable-next-line prettier/prettier
      throw new ConflictException(
        'Student already exists with same unique field',
      );
    }

    throw error;
  }
}
