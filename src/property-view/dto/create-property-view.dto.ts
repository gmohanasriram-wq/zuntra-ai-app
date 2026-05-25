import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CreatePropertyViewDto {
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @Type(() => Number)
  @IsInt()
  propertyId!: number;
}