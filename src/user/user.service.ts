import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.user.create({ data })
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        properties: true,
        likes: true,
      },
    })
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    })
  }
}