import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdatePositionDto } from './dto/update-position.dto';
import { TrackingService } from './tracking.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('tracking')
@ApiBearerAuth()
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post('bookings/:bookingId/position')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({ summary: 'Mettre à jour la position GPS du chauffeur' })
  updateDriverPosition(
    @Req() request: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.trackingService.updateDriverPosition(
      request.user.sub,
      bookingId,
      dto,
    );
  }

  @Get('bookings/:bookingId/position')
  @ApiOperation({
    summary: "Lire la dernière position GPS d'un trajet (passager/chauffeur)",
  })
  getBookingPosition(
    @Req() request: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.trackingService.getBookingPosition(request.user.sub, bookingId);
  }
}
