import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRatingDto {
  @ApiProperty({ example: 'f2b316df-99d7-4a87-8419-8109ef404d0a' })
  @IsUUID()
  bookingId!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  rateeId!: string;

  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiPropertyOptional({ example: 'Conducteur très ponctuel et agréable' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
