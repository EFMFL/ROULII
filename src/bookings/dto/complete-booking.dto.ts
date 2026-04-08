import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteBookingDto {
  @ApiPropertyOptional({
    example: 'Paiement especes confirme en main propre',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
