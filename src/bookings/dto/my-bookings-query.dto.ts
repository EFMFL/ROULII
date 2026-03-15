import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class MyBookingsQueryDto {
  @ApiPropertyOptional({
    enum: ['upcoming', 'past'],
    default: 'upcoming',
  })
  @IsOptional()
  @IsIn(['upcoming', 'past'])
  tab?: 'upcoming' | 'past';
}
