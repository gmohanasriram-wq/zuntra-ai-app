import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ApartmentService {

  create(data: any) {
    return prisma.apartment.create({ data });
  }

  findAll() {
    return prisma.apartment.findMany();
  }

  findOne(id: number) {
    return prisma.apartment.findUnique({
      where: { id },
    });
  }

  update(id: number, data: any) {
    return prisma.apartment.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return prisma.apartment.delete({
      where: { id },
    });
  }
}