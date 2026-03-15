import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateTripDto {
  @ApiProperty({ example: 'Paris Gare de Lyon' })
  @IsString()
  @Length(2, 200)
  origin!: string;

  @ApiProperty({ example: 'Lyon Part-Dieu' })
  @IsString()
  @Length(2, 200)
  destination!: string;

  @ApiProperty({ example: '2026-08-20T15:30:00.000Z' })
  @IsDateString()
  departureTime!: string;

  @ApiProperty({ minimum: 1, maximum: 8, example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  seatsAvailable!: number;

  @ApiPropertyOptional({
    example: 'f2b316df-99d7-4a87-8419-8109ef404d0a',
    description: 'Optionnel, sinon premier vehicule du conducteur',
  })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
