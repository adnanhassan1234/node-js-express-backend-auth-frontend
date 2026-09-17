/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSportsDto } from './dto/create-sports.dto';
import { UpdateSportsDto } from './dto/update-sports.dto';

@Injectable()
export class SportsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createSportsDto: CreateSportsDto) {
    try {
      return await this.prismaService.sports.create({
        data: createSportsDto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  findAll() {
    return this.prismaService.sports.findMany({
      orderBy: {
        ranking: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const player = await this.prismaService.sports.findUnique({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException(`Player with id ${id} not found`);
    }

    return player;
  }

  async update(id: number, updateSportsDto: UpdateSportsDto) {
    await this.findOne(id);

    try {
      return await this.prismaService.sports.update({
        where: { id },
        data: updateSportsDto,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prismaService.sports.delete({
      where: { id },
    });
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Player already exists with same unique field (jerseyNumber or email)',
      );
    }

    throw error;
  }
}
