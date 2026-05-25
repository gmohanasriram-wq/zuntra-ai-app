
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // Create Subscription
  async createSubscription(data: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: {
        userId: data.userId,
        planType: data.planType,
        planDuration: data.planDuration,
        amount: data.amount,
        paymentId: data.paymentId,
        propertyType: data.propertyType,
        startDate: new Date(data.startDate),
        expiryDate: new Date(data.expiryDate),
      },
    });
  }

  // Get All Subscriptions
  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: {
        user: true,
      },
    });
  }

  // Get Subscription By ID
  async getSubscriptionById(id: number) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  // Get User Subscriptions
  async getUserSubscriptions(userId: number) {
    return this.prisma.subscription.findMany({
      where: { userId },
    });
  }

  // Update Subscription
  async updateSubscription(id: number, data: Partial<CreateSubscriptionDto>) {
    return this.prisma.subscription.update({
      where: { id },
      data,
    });
  }

  // Delete Subscription
  async deleteSubscription(id: number) {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }
}