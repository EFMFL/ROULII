import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class AdminTripsQueryDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'CANCELLED', 'COMPLETED'])
  status?: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  cursor?: string;
}
