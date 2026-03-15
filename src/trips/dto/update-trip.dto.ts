import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateTripDto {
  @ApiPropertyOptional({ example: '2026-08-20T17:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 8, example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  seatsAvailable?: number;
}
