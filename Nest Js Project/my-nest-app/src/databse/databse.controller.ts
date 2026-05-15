import { Controller, Get, HttpCode } from '@nestjs/common';
import { DatabseService } from './databse.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabseService) {}

  @Get('status')
  @HttpCode(200)
  //   @Redirect('https://adnandevportfolio.netlify.app/#projects', 301)
  getStatus() {
    return {
      status: this.databaseService.getStatus(),
    };
  }
}
