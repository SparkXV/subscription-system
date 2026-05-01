import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  stripePriceId?: string;
}

@Injectable()
export class PlansService {
  private readonly plans: Plan[];

  constructor(private readonly configService: ConfigService) {
    this.plans = [
      {
        id: 'basic',
        name: 'Basic',
        price: 1000,
        currency: 'usd',
        interval: 'month',
        stripePriceId: this.configService.get<string>('STRIPE_BASIC_PRICE_ID'),
      },
      {
        id: 'standard',
        name: 'Standard',
        price: 2000,
        currency: 'usd',
        interval: 'month',
        stripePriceId: this.configService.get<string>(
          'STRIPE_STANDARD_PRICE_ID',
        ),
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 5000,
        currency: 'usd',
        interval: 'month',
        stripePriceId: this.configService.get<string>(
          'STRIPE_PREMIUM_PRICE_ID',
        ),
      },
    ];
  }

  findAll(): Plan[] {
    return this.plans.map(({ stripePriceId, ...rest }) => rest as Plan);
  }

  findById(planId: string): Plan {
    const plan = this.plans.find((p) => p.id === planId);
    if (!plan) {
      throw new NotFoundException(`Plan "${planId}" not found`);
    }
    return plan;
  }
}
