import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class SearchTripsDto {
  @ApiPropertyOptional({ example: 'Paris' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  origin?: string;

  @ApiPropertyOptional({ example: 'Lyon' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  destination?: string;

  @ApiPropertyOptional({
    example: '2026-08-20',
    description: 'Format YYYY-MM-DD',
  })
  @IsOptional()
  @IsString()
  @Length(10, 10)
  date?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 8, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  seats?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  @ApiPropertyOptional({ description: 'Cursor de pagination (tripId)' })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
