import { Module } from '@nestjs/common';
import { UserPreferenceController } from './user-preference.controller';
import { UserPreferenceService } from './user-preference.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UserPreferenceController],
  providers: [UserPreferenceService, PrismaService],
})
export class UserPreferenceModule {}