import { Module } from '@nestjs/common';
import { PGDetailsController } from './pg-details.controller';
import { PGDetailsService } from './pg-details.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PGDetailsController],
  providers: [PGDetailsService, PrismaService],
})
export class PGDetailsModule {}