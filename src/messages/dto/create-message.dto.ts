import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class CreateMessageDto {
  @Type(() => Number)
  @IsInt()
  senderId!: number;

  @Type(() => Number)
  @IsInt()
  receiverId!: number;

  @Type(() => Number)
  @IsInt()
  propertyId!: number;

  @IsString()
  message!: string;
}