
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { UserPreferenceService } from './user-preference.service';
import { CreateUserPreferenceDto } from './dto/create-user-preference.dto';

@Controller('user-preferences')
export class UserPreferenceController {
  constructor(
    private readonly userPreferenceService: UserPreferenceService,
  ) {}

  // Create
  @Post()
  create(@Body() dto: CreateUserPreferenceDto) {
    return this.userPreferenceService.createPreference(dto);
  }

  // Get All
  @Get()
  findAll() {
    return this.userPreferenceService.getAllPreferences();
  }

  // Get By ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userPreferenceService.getPreferenceById(Number(id));
  }

  // Get By User
  @Get('user/:userId')
  findUserPreferences(@Param('userId') userId: string) {
    return this.userPreferenceService.getUserPreferences(Number(userId));
  }

  // Update
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateUserPreferenceDto>,
  ) {
    return this.userPreferenceService.updatePreference(Number(id), dto);
  }

  // Delete
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userPreferenceService.deletePreference(Number(id));
  }
}