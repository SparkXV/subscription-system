import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutDto {
  @ApiProperty({ example: 'basic', enum: ['basic', 'standard', 'premium'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['basic', 'standard', 'premium'])
  planId: string;
}
