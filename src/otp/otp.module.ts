import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [OtpController],
  providers: [OtpService, PrismaService],
})
export class OtpModule {}