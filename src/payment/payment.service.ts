import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { PaymentRecord, PaymentDocument } from './paymentRecord';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectModel(PaymentRecord.name)
    private paymentModel: Model<PaymentDocument>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2025-11-17.clover',
    });
  }

  /* Create Stripe PaymentIntent */
  async createStripePayment(dto: CreatePaymentDto) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(dto.totalAmount * 100), // cents
      currency: 'usd',
      payment_method_types: ['card'],
    });

    const payment = await this.paymentModel.create({
      userId: dto.userId,
      seasonId: dto.seasonId,
      paymentType: 'stripe',
      paymentIntent: paymentIntent.id,
      totalAmount: dto.totalAmount,
      paymentStatus: 'pending',
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    };
  }

  /* Update payment status (for webhook or manual update) */
  async updatePaymentStatus(paymentIntent: string, status: string) {
    return this.paymentModel.findOneAndUpdate(
      { paymentIntent },
      { paymentStatus: status },
      { new: true },
    );
  }

  /* Get all payments */
  async getAllPayments() {
    return this.paymentModel.find().sort({ createdAt: -1 });
  }

  /* Get payments by user */
  async getPaymentsByUser(userId: string) {
    return this.paymentModel.find({ userId }).sort({ createdAt: -1 });
  }

  /* Get single payment */
  async getPaymentById(id: string) {
    return this.paymentModel.findById(id);
  }
}
