import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Public } from '../common/decorators/public.decorator';
import { CalculateTripDto } from './dto/calculate-trip.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { MyTripsQueryDto } from './dto/my-trips-query.dto';
import { SearchTripsDto } from './dto/search-trips.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripsService } from './trips.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('trips')
@ApiBearerAuth()
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Public()
  @Get('calculate')
  calculate(@Query() calculateTripDto: CalculateTripDto) {
    return this.tripsService.calculate(calculateTripDto);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createTripDto: CreateTripDto,
  ) {
    return this.tripsService.create(request.user.sub, createTripDto);
  }

  @Public()
  @Get()
  search(@Query() searchTripsDto: SearchTripsDto) {
    return this.tripsService.search(searchTripsDto);
  }

  @Get('my')
  findMyTrips(
    @Req() request: AuthenticatedRequest,
    @Query() myTripsQueryDto: MyTripsQueryDto,
  ) {
    return this.tripsService.findMyTrips(request.user.sub, myTripsQueryDto);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateTripDto: UpdateTripDto,
  ) {
    return this.tripsService.update(request.user.sub, id, updateTripDto);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.tripsService.remove(request.user.sub, id);
  }
}
