import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Envoyer un message dans le fil de réservation' })
  send(@Req() request: AuthenticatedRequest, @Body() dto: SendMessageDto) {
    return this.messagesService.send(request.user.sub, dto);
  }

  @Get('bookings/:bookingId')
  @ApiOperation({ summary: "Lire les messages d'une réservation" })
  findByBooking(
    @Req() request: AuthenticatedRequest,
    @Param('bookingId') bookingId: string,
  ) {
    return this.messagesService.findByBooking(request.user.sub, bookingId);
  }
}
