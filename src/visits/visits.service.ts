import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class VisitService {

  create(data: any) {
    return prisma.visit.create({
      data,
    });
  }

  findAll() {
    return prisma.visit.findMany({
      include: {
        user: true,
        property: true,
      },
    });
  }

  findOne(id: number) {
    return prisma.visit.findUnique({
      where: { id },
      include: {
        user: true,
        property: true,
      },
    });
  }

  update(id: number, data: any) {
    return prisma.visit.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return prisma.visit.delete({
      where: { id },
    });
  }
}