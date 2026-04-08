import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RechargeWalletDto {
  @ApiPropertyOptional({ example: 20, minimum: 1, default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  amount: number = 20;

  @ApiPropertyOptional({ example: 'Recharge manuelle chauffeur' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
