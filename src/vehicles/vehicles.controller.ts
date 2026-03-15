import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createVehicleDto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(request.user.sub, createVehicleDto);
  }

  @Get('me')
  findMine(@Req() request: AuthenticatedRequest) {
    return this.vehiclesService.findMine(request.user.sub);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(request.user.sub, id, updateVehicleDto);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.vehiclesService.remove(request.user.sub, id);
  }
}
