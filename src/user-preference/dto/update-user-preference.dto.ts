import { PartialType } from '@nestjs/mapped-types';
import { CreateUserPreferenceDto } from './create-user-preference.dto';

export class UpdateUserPreferenceDto extends PartialType(CreateUserPreferenceDto) {}
