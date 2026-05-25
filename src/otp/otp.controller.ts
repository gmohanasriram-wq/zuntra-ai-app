import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  sendOtp(@Body() body: { mobile: string }) {
    return this.otpService.sendOtp(body.mobile);
  }

  @Post('verify')
  verifyOtp(@Body() body: { mobile: string; otp: string }) {
    return this.otpService.verifyOtp(body.mobile, body.otp);
  }
}