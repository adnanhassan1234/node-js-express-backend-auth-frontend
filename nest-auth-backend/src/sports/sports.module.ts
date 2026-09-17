import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SportsController } from './sports.controller';
import { SportsService } from './sports.service';

@Module({
  imports: [PrismaModule],
  controllers: [SportsController],
  providers: [SportsService],
})
export class SportsModule {}
