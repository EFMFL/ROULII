import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MyBookingsQueryDto } from './dto/my-bookings-query.dto';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
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
  @ApiOperation({ summary: 'Annuler une réservation (passager)' })
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelByPassenger(request.user.sub, id, dto);
  }
}
