import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyViewDto } from './dto/create-property-view.dto';

@Injectable()
export class PropertyViewService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePropertyViewDto) {
    return this.prisma.propertyView.create({
      data: {
        userId: dto.userId,
        propertyId: dto.propertyId,
      },
    });
  }

  async findAll() {
    return this.prisma.propertyView.findMany({
      include: {
        user: true,
        property: true,
      },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.propertyView.findMany({
      where: { userId },
      include: {
        property: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.propertyView.delete({
      where: { id },
    });
  }
}