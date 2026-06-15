/* eslint-disable @typescript-eslint/no-unsafe-return */
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class UsersService {
  constructor(
    private prismaService: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async findAll() {
    return this.prismaService.user.findMany();
  }

  async findusers(query: { role: string; name: string }) {
    const cacheKey = `users:${query.role}:${query.name}`;
    const cachedUsers = await this.redis.get(cacheKey);

    if (cachedUsers) {
      console.log('Data from Redis Cache');
      return JSON.parse(cachedUsers);
    }

    const users = await this.prismaService.user.findMany({
      where: {
        emailVerified: true,
        role: query.role,
        name: {
          contains: query.name,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(users), 'EX', 600);

    return users;
  }

  // for single upload

  // uploadFile(file: Express.Multer.File) {
  //   return {
  //     message: 'File uploaded successfully',
  //     filename: file.filename,
  //     path: file.path,
  //     size: file.size,
  //   };
  // }

  // for multiple upload files
  uploadMultipleFiles(files: Express.Multer.File[], name: string) {
    if (files.length === 0) {
      return {
        message: 'No files uploaded',
      };
    }
    return {
      message: 'Files uploaded successfully',
      name,
      files: files.map((file) => ({
        filename: file.filename,
        path: file.path,
        size: file.size,
      })),
    };
  }

  async getAllFiles() {
    return this.prismaService.user.findMany();
  }
}
