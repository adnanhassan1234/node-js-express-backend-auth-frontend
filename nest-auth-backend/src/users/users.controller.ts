/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from 'src/role/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/role/roles.decorator';
// import { AuthGuard } from '@nestjs/passport';
// import { UseGuards } from '@nestjs/common';
// import { SupabaseAuthGuard } from 'src/auth/supabse-auth/supabase-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/utils/multer.utils';

// @UseGuards(SupabaseAuthGuard)
// @UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get()
  async findAll() {
    const data = await this.usersService.findAll();
    return {
      success: true,
      message: 'Record found successfully',
      data,
    };
  }

  @Get('/find')
  @Roles('user')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async findOne(@Query() query: { role: string; name: string }) {
    const data = await this.usersService.findusers(query);
    return {
      success: true,
      message: 'Record found successfully',
      data,
    };
  }

  // for single upload

  // @Post('/uploads')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: './uploads',

  //       filename: (req, file, callback) => {
  //         const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         callback(null, uniqueName + extname(file.originalname));
  //       },
  //     }),
  //   }),
  // )
  // uploadFile(@UploadedFile() file: Express.Multer.File) {
  //   return this.usersService.uploadFile(file);
  // }

  // for multiple upload files
  @Post('uploads')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('name') name: string,
  ) {
    return this.usersService.uploadMultipleFiles(files, name);
  }

  @Get('/all-files')
  async getAllFiles() {
    const data = await this.usersService.getAllFiles();
    return {
      success: true,
      message: 'Record found successfully',
      data,
    };
  }
}
