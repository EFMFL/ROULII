import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TripsController } from './trips.controller';
import { DistanceService } from './services/distance.service';
import { TripsService } from './trips.service';

@Module({
  imports: [PrismaModule],
  controllers: [TripsController],
  providers: [TripsService, DistanceService],
})
export class TripsModule {}
