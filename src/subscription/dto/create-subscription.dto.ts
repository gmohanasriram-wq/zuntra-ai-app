export class CreateSubscriptionDto {
  userId!: number;
  planType!: string;
  planDuration!: string;
  amount!: number;
  paymentId!: string;
  propertyType!: string;
  startDate!: Date;
  expiryDate!: Date;
}
