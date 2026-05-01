import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlansService } from './plans.service';

describe('PlansService', () => {
  let service: PlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map = {
                STRIPE_BASIC_PRICE_ID: 'price_basic',
                STRIPE_STANDARD_PRICE_ID: 'price_standard',
                STRIPE_PREMIUM_PRICE_ID: 'price_premium',
              };
              return map[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PlansService>(PlansService);
  });

  describe('findAll', () => {
    it('should return 3 plans without stripePriceId', () => {
      const plans = service.findAll();

      expect(plans).toHaveLength(3);
      expect(plans[0].id).toBe('basic');
      expect(plans[1].id).toBe('standard');
      expect(plans[2].id).toBe('premium');
      plans.forEach((plan) => {
        expect(plan).not.toHaveProperty('stripePriceId');
      });
    });
  });

  describe('findById', () => {
    it('should return the plan for a valid id', () => {
      const plan = service.findById('basic');

      expect(plan.id).toBe('basic');
      expect(plan.name).toBe('Basic');
      expect(plan.stripePriceId).toBe('price_basic');
    });

    it('should throw NotFoundException for invalid id', () => {
      expect(() => service.findById('nonexistent')).toThrow(NotFoundException);
    });
  });
});
