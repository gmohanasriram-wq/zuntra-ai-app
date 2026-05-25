import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  // CREATE MESSAGE (SAFE VERSION)
  async createMessage(dto: CreateMessageDto) {
    const [sender, receiver, property] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.senderId } }),
      this.prisma.user.findUnique({ where: { id: dto.receiverId } }),
      this.prisma.pGDetails.findUnique({ where: { id: dto.propertyId } }),
    ]);

    // ❌ prevent Prisma crash
    if (!sender) {
      throw new BadRequestException('Invalid senderId');
    }
    if (!receiver) {
      throw new BadRequestException('Invalid receiverId');
    }
    if (!property) {
      throw new BadRequestException('Invalid propertyId');
    }

    return this.prisma.message.create({
      data: {
        senderId: dto.senderId,
        receiverId: dto.receiverId,
        propertyId: dto.propertyId,
        message: dto.message,
      },
      include: {
        sender: true,
        receiver: true,
        property: true,
      },
    });
  }

  // GET ALL MESSAGES
  async getAllMessages() {
    return this.prisma.message.findMany({
      include: {
        sender: true,
        receiver: true,
        property: true,
      },
    });
  }

  // GET BY PROPERTY
  async getByProperty(propertyId: number) {
    return this.prisma.message.findMany({
      where: { propertyId },
      include: {
        sender: true,
        receiver: true,
        property: true,
      },
    });
  }

  // DELETE MESSAGE
  async deleteMessage(id: number) {
    return this.prisma.message.delete({
      where: { id },
    });
  }
}