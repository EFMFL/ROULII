import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.getMe(request.user.sub);
  }

  @Patch('me')
  updateMe(
    @Req() request: AuthenticatedRequest,
    @Body() updateMeDto: UpdateMeDto,
  ) {
    return this.usersService.updateMe(request.user.sub, updateMeDto);
  }

  @Patch('me/fcm-token')
  updateFcmToken(
    @Req() request: AuthenticatedRequest,
    @Body() updateFcmTokenDto: UpdateFcmTokenDto,
  ) {
    return this.usersService.updateFcmToken(
      request.user.sub,
      updateFcmTokenDto,
    );
  }

  @Public()
  @Get(':id')
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }

  @Delete('me')
  deleteMe(@Req() request: AuthenticatedRequest) {
    return this.usersService.anonymizeMe(request.user.sub);
  }
}
