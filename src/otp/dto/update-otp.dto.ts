import { PartialType } from '@nestjs/mapped-types';
import { CreateOtpDto } from './create-otp.dto';

export class UpdateOtpDto extends PartialType(CreateOtpDto) {}
