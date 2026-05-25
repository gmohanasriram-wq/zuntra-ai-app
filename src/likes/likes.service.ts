import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikeService {
  constructor(private prisma: PrismaService) {}

  // Create Like
  async createLike(data: CreateLikeDto) {
    return this.prisma.like.create({
      data,
    });
  }

  // Get All Likes
  async getAllLikes() {
    return this.prisma.like.findMany({
      include: {
        user: true,
        property: true,
      },
    });
  }

  // Get Like By ID
  async getLikeById(id: number) {
    return this.prisma.like.findUnique({
      where: { id },
      include: {
        user: true,
        property: true,
      },
    });
  }

  // Get User Likes
  async getUserLikes(userId: number) {
    return this.prisma.like.findMany({
      where: { userId },
      include: {
        property: true,
      },
    });
  }

  // Delete Like
  async deleteLike(id: number) {
    return this.prisma.like.delete({
      where: { id },
    });
  }
}