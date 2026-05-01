import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true, versionKey: false })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['basic', 'standard', 'premium'] })
  planId: string;

  @Prop({
    required: true,
    enum: ['active', 'canceled', 'past_due', 'incomplete'],
    default: 'incomplete',
  })
  status: string;

  @Prop({ required: true, index: true })
  stripeSubscriptionId: string;

  @Prop()
  stripeCheckoutSessionId: string;

  @Prop()
  currentPeriodStart: Date;

  @Prop()
  currentPeriodEnd: Date;

  @Prop({ default: null })
  canceledAt: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
