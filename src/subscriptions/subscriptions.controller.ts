import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateCheckoutDto } from './create-checkout.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, schema: { example: { checkoutUrl: 'https://checkout.stripe.com/c/pay/...' } } })
  async createCheckout(
    @CurrentUser() user: any,
    @Body() createCheckoutDto: CreateCheckoutDto,
  ) {
    return this.subscriptionsService.createCheckoutSession(
      user.userId,
      createCheckoutDto.planId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        _id: '664a...',
        userId: '664a...',
        planId: 'basic',
        status: 'active',
        stripeSubscriptionId: 'sub_...',
        currentPeriodStart: '2026-05-01T00:00:00.000Z',
        currentPeriodEnd: '2026-06-01T00:00:00.000Z',
      },
    },
  })
  async getCurrentSubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.getCurrentSubscription(user.userId);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, schema: { example: { message: 'Subscription has been canceled' } } })
  async cancelSubscription(@CurrentUser() user: any) {
    return this.subscriptionsService.cancelSubscription(user.userId);
  }

}
