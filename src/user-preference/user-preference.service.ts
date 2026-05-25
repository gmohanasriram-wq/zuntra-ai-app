import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserPreferenceDto } from './dto/create-user-preference.dto';

@Injectable()
export class UserPreferenceService {
  constructor(private prisma: PrismaService) {}

  // Create
  async createPreference(data: CreateUserPreferenceDto) {
    return this.prisma.userPreference.create({
      data,
    });
  }

  // Get All
  async getAllPreferences() {
    return this.prisma.userPreference.findMany({
      include: {
        user: true,
      },
    });
  }

  // Get By ID
  async getPreferenceById(id: number) {
    return this.prisma.userPreference.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  // Get By User
  async getUserPreferences(userId: number) {
    return this.prisma.userPreference.findMany({
      where: { userId },
    });
  }

  // Update
  async updatePreference(
    id: number,
    data: Partial<CreateUserPreferenceDto>,
  ) {
    return this.prisma.userPreference.update({
      where: { id },
      data,
    });
  }

  // Delete
  async deletePreference(id: number) {
    return this.prisma.userPreference.delete({
      where: { id },
    });
  }
}