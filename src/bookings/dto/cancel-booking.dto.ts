import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelBookingDto {
  @ApiPropertyOptional({ example: 'Changement de plans' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
