import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { PlansService } from './plans.service';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        { id: 'basic', name: 'Basic', price: 1000, currency: 'usd', interval: 'month' },
        { id: 'standard', name: 'Standard', price: 2000, currency: 'usd', interval: 'month' },
        { id: 'premium', name: 'Premium', price: 5000, currency: 'usd', interval: 'month' },
      ],
    },
  })
  findAll() {
    return this.plansService.findAll();
  }
}
