import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Peugeot' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  brand?: string;

  @ApiPropertyOptional({ example: '208' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  model?: string;

  @ApiPropertyOptional({ example: 'Blanc' })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  color?: string;

  @ApiPropertyOptional({ example: 'EF-456-GH' })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  @Matches(/^[A-Za-z0-9- ]+$/)
  plate?: string;
}
