import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DriverBookingActionDto {
  @ApiProperty({ enum: ['accept', 'reject'] })
  @IsIn(['accept', 'reject'])
  action!: 'accept' | 'reject';

  @ApiPropertyOptional({ example: 'Trajet incompatible avec mes horaires' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
