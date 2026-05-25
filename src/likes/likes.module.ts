import { Module } from '@nestjs/common';
import { LikeController } from './likes.controller';
import { LikeService } from './likes.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [LikeController],
  providers: [LikeService, PrismaService],
})
export class LikeModule {}