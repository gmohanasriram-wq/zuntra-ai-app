import { PartialType } from '@nestjs/mapped-types';
import { CreatePropertyViewDto } from './create-property-view.dto';

export class UpdatePropertyViewDto extends PartialType(CreatePropertyViewDto) {}
