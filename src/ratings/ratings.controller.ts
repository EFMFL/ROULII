import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../common/decorators/public.decorator';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('ratings')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Soumettre une note après un trajet' })
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateRatingDto) {
    return this.ratingsService.create(request.user.sub, dto);
  }

  @Public()
  @Get('users/:userId')
  @ApiOperation({ summary: 'Notes reçues par un utilisateur' })
  findForUser(@Param('userId') userId: string) {
    return this.ratingsService.findForUser(userId);
  }
}
