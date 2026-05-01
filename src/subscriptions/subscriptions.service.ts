import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository';
import { StripeService } from '../stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { PlansService } from '../plans/plans.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    private readonly usersService: UsersService,
    private readonly plansService: PlansService,
  ) {}

  async createCheckoutSession(userId: string, planId: string) {
    const plan = this.plansService.findById(planId);

    const existingSub =
      await this.subscriptionsRepository.findActiveByUserId(userId);
    if (existingSub) {
      throw new BadRequestException(
        'You already have an active subscription. Cancel it first to switch plans.',
      );
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        user.name,
      );
      stripeCustomerId = customer.id;
      await this.usersService.updateStripeCustomerId(userId, stripeCustomerId);
    }

    const session = await this.stripeService.createCheckoutSession(
      stripeCustomerId,
      plan.stripePriceId,
      userId,
    );

    return { checkoutUrl: session.url };
  }

  async getCurrentSubscription(userId: string) {
    const subscription =
      await this.subscriptionsRepository.findActiveByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }
    return subscription;
  }

  async cancelSubscription(userId: string) {
    const subscription =
      await this.subscriptionsRepository.findActiveByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    await this.stripeService.cancelSubscription(
      subscription.stripeSubscriptionId,
    );

    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
    await subscription.save();

    return { message: 'Subscription has been canceled' };
  }

  async createFromWebhook(data: {
    userId: string;
    stripeSubscriptionId: string;
    stripeCheckoutSessionId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }) {
    const stripeSubscription = await this.stripeService.retrieveSubscription(
      data.stripeSubscriptionId,
    );

    const priceId = stripeSubscription.items.data[0]?.price?.id;
    const plan = this.findPlanByPriceId(priceId);

    return this.subscriptionsRepository.create({
      userId: data.userId as any,
      planId: plan?.id || 'unknown',
      status: data.status,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCheckoutSessionId: data.stripeCheckoutSessionId,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
    });
  }

  async updateFromWebhook(
    stripeSubscriptionId: string,
    data: Partial<{
      status: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      canceledAt: Date;
    }>,
  ) {
    return this.subscriptionsRepository.updateByStripeSubscriptionId(
      stripeSubscriptionId,
      data,
    );
  }

  private findPlanByPriceId(priceId: string) {
    for (const id of ['basic', 'standard', 'premium']) {
      const plan = this.plansService.findById(id);
      if (plan.stripePriceId === priceId) return plan;
    }
    return null;
  }
}
