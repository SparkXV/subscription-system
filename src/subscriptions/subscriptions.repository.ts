import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema';

@Injectable()
export class SubscriptionsRepository {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  async create(data: Partial<Subscription>): Promise<SubscriptionDocument> {
    return this.subscriptionModel.create(data);
  }

  async findActiveByUserId(
    userId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ userId, status: { $in: ['active', 'incomplete'] } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOne({ stripeSubscriptionId })
      .exec();
  }

  async updateByStripeSubscriptionId(
    stripeSubscriptionId: string,
    data: Partial<Subscription>,
  ): Promise<SubscriptionDocument | null> {
    return this.subscriptionModel
      .findOneAndUpdate({ stripeSubscriptionId }, data, { new: true })
      .exec();
  }

}
