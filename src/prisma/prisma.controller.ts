import { Controller, Get } from '@nestjs/common'
import { PrismaService } from './prisma.service'

@Controller('prisma')
export class PrismaController {
  constructor(private prisma: PrismaService) {}

  @Get('users')
  async getUsers() {
    return this.prisma.user.findMany()
  }
}