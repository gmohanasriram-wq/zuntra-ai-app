import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  // Generate 6-digit OTP
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP (store in DB)
  async sendOtp(mobile: string) {
    const otp = this.generateOtp();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 min expiry

    await this.prisma.otp.create({
      data: {
        mobile,
        otp,
        expiresAt,
      },
    });

    // In real app → integrate SMS service here
    return {
      message: 'OTP sent successfully',
      otp, // remove in production
    };
  }

  // Verify OTP
  async verifyOtp(mobile: string, otp: string) {
    const record = await this.prisma.otp.findFirst({
      where: {
        mobile,
        otp,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!record) {
      return { success: false, message: 'Invalid OTP' };
    }

    if (record.expiresAt < new Date()) {
      return { success: false, message: 'OTP expired' };
    }

    return { success: true, message: 'OTP verified successfully' };
  }
}
