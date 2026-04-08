import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../common/decorators/public.decorator';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentsService } from './payments.service';

type AuthenticatedRequest = Request & { user: JwtPayload };
type WebhookRequest = Request & { rawBody?: Buffer };

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth()
  @Post('intent')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Créer un PaymentIntent Stripe pour une réservation',
  })
  createPaymentIntent(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(
      request.user.sub,
      dto.bookingId,
    );
  }

  @Public()
  @Post('webhook')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({ summary: 'Webhook Stripe (usage interne)' })
  handleWebhook(
    @Req() request: WebhookRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = request.rawBody ?? Buffer.alloc(0);
    return this.paymentsService.handleWebhook(rawBody, signature);
  }

  @ApiBearerAuth()
  @Get('bookings/:bookingId')
  @ApiOperation({ summary: 'Informations de paiement pour une réservation' })
  getPaymentForBooking(
    @Req() request: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.paymentsService.getPaymentForBooking(
      request.user.sub,
      bookingId,
    );
  }
}
