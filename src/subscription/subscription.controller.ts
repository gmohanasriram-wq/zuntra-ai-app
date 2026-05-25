import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { SubscriptionService } from './subscription.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // Create Subscription
  @Post()
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(dto);
  }

  // Get All Subscriptions
  @Get()
  findAll() {
    return this.subscriptionService.getAllSubscriptions();
  }

  // Get Subscription By ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionService.getSubscriptionById(Number(id));
  }

  // Get User Subscriptions
  @Get('user/:userId')
  findUserSubscriptions(@Param('userId') userId: string) {
    return this.subscriptionService.getUserSubscriptions(Number(userId));
  }

  // Update Subscription
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateSubscriptionDto>,
  ) {
    return this.subscriptionService.updateSubscription(Number(id), dto);
  }

  // Delete Subscription
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionService.deleteSubscription(Number(id));
  }
}