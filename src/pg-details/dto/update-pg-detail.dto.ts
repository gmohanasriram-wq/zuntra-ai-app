import { PartialType } from '@nestjs/mapped-types';
import { CreatePGDetailsDto } from './create-pg-detail.dto';

export class UpdatePgDetailDto extends PartialType(CreatePGDetailsDto) {}
