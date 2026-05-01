import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { StripeService } from '../stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { PlansService } from '../plans/plans.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionsRepo: jest.Mocked<Partial<SubscriptionsRepository>>;
  let stripeService: jest.Mocked<Partial<StripeService>>;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let plansService: jest.Mocked<Partial<PlansService>>;

  const mockSubscription = {
    _id: 'sub-id',
    userId: 'user-id',
    planId: 'basic',
    status: 'active',
    stripeSubscriptionId: 'sub_stripe_123',
    canceledAt: null,
    save: jest.fn(),
  };

  const mockPlan = {
    id: 'basic',
    name: 'Basic',
    price: 1000,
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_basic',
  };

  const mockUser = {
    _id: 'user-id',
    name: 'Test',
    email: 'qa@example.com',
    stripeCustomerId: 'cus_123',
  };

  beforeEach(async () => {
    subscriptionsRepo = {
      findActiveByUserId: jest.fn(),
      create: jest.fn(),
      updateByStripeSubscriptionId: jest.fn(),
    };

    stripeService = {
      createCustomer: jest.fn(),
      createCheckoutSession: jest.fn(),
      cancelSubscription: jest.fn(),
      retrieveSubscription: jest.fn(),
    };

    usersService = {
      findById: jest.fn(),
      updateStripeCustomerId: jest.fn(),
    };

    plansService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: SubscriptionsRepository, useValue: subscriptionsRepo },
        { provide: StripeService, useValue: stripeService },
        { provide: UsersService, useValue: usersService },
        { provide: PlansService, useValue: plansService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session for a user', async () => {
      plansService.findById.mockReturnValue(mockPlan as any);
      subscriptionsRepo.findActiveByUserId.mockResolvedValue(null);
      usersService.findById.mockResolvedValue(mockUser as any);
      stripeService.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/test',
      } as any);

      const result = await service.createCheckoutSession('user-id', 'basic');

      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/test',
      });
      expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
        'cus_123',
        'price_basic',
        'user-id',
      );
    });

    it('should throw if user already has active subscription', async () => {
      plansService.findById.mockReturnValue(mockPlan as any);
      subscriptionsRepo.findActiveByUserId.mockResolvedValue(
        mockSubscription as any,
      );

      await expect(
        service.createCheckoutSession('user-id', 'basic'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create Stripe customer if user has none', async () => {
      const userWithoutStripe = { ...mockUser, stripeCustomerId: null };
      plansService.findById.mockReturnValue(mockPlan as any);
      subscriptionsRepo.findActiveByUserId.mockResolvedValue(null);
      usersService.findById.mockResolvedValue(userWithoutStripe as any);
      stripeService.createCustomer.mockResolvedValue({ id: 'cus_new' } as any);
      stripeService.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/test',
      } as any);

      await service.createCheckoutSession('user-id', 'basic');

      expect(stripeService.createCustomer).toHaveBeenCalledWith(
        'qa@example.com',
        'Test',
      );
      expect(usersService.updateStripeCustomerId).toHaveBeenCalledWith(
        'user-id',
        'cus_new',
      );
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return active subscription', async () => {
      subscriptionsRepo.findActiveByUserId.mockResolvedValue(
        mockSubscription as any,
      );

      const result = await service.getCurrentSubscription('user-id');
      expect(result).toEqual(mockSubscription);
    });

    it('should throw NotFoundException if no active subscription', async () => {
      subscriptionsRepo.findActiveByUserId.mockResolvedValue(null);

      await expect(
        service.getCurrentSubscription('user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription and set canceledAt', async () => {
      subscriptionsRepo.findActiveByUserId.mockResolvedValue(
        mockSubscription as any,
      );
      stripeService.cancelSubscription.mockResolvedValue({} as any);

      const result = await service.cancelSubscription('user-id');

      expect(stripeService.cancelSubscription).toHaveBeenCalledWith(
        'sub_stripe_123',
      );
      expect(mockSubscription.canceledAt).toBeInstanceOf(Date);
      expect(mockSubscription.save).toHaveBeenCalled();
      expect(result.message).toContain('canceled');
    });

    it('should throw NotFoundException if no active subscription', async () => {
      subscriptionsRepo.findActiveByUserId.mockResolvedValue(null);

      await expect(
        service.cancelSubscription('user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFromWebhook', () => {
    it('should update subscription by stripe id', async () => {
      subscriptionsRepo.updateByStripeSubscriptionId.mockResolvedValue(
        mockSubscription as any,
      );

      await service.updateFromWebhook('sub_stripe_123', {
        status: 'canceled',
      });

      expect(
        subscriptionsRepo.updateByStripeSubscriptionId,
      ).toHaveBeenCalledWith('sub_stripe_123', { status: 'canceled' });
    });
  });
});
