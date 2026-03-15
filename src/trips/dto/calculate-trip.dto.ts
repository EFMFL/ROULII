import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CalculateTripDto {
  @ApiProperty({ example: '48.8566,2.3522' })
  @IsString()
  @Length(2, 200)
  origin!: string;

  @ApiProperty({ example: '45.7640,4.8357' })
  @IsString()
  @Length(2, 200)
  destination!: string;
}
