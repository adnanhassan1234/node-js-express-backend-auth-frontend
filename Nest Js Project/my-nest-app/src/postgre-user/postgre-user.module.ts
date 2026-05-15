import { Module } from '@nestjs/common';
import { PostgreUserService } from './postgre-user.service';
import { PostgreUserController } from './postgre-user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgreUser } from './entities/postgre-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostgreUser])],
  controllers: [PostgreUserController],
  providers: [PostgreUserService],
})
export class PostgreUserModule {}
