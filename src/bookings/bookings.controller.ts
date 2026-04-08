import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CompleteBookingDto } from './dto/complete-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { DriverBookingActionDto } from './dto/driver-booking-action.dto';
import { MyBookingsQueryDto } from './dto/my-bookings-query.dto';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Réserver un trajet' })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(request.user.sub, createBookingDto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes réservations en tant que passager' })
  findMine(
    @Req() request: AuthenticatedRequest,
    @Query() query: MyBookingsQueryDto,
  ) {
    return this.bookingsService.findMine(request.user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une réservation" })
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingsService.findOne(request.user.sub, id);
  }

  @Post(':id/cancel')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Annuler une réservation (passager)' })
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelByPassenger(request.user.sub, id, dto);
  }

  @Post(':id/driver-action')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @ApiOperation({ summary: 'Accepter ou refuser une réservation (chauffeur)' })
  driverAction(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: DriverBookingActionDto,
  ) {
    return this.bookingsService.driverAction(request.user.sub, id, dto);
  }

  @Post(':id/complete')
  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Marquer une réservation comme terminée (chauffeur)',
  })
  complete(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CompleteBookingDto,
  ) {
    return this.bookingsService.completeByDriver(request.user.sub, id, dto);
  }
}
