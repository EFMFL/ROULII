import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'f2b316df-99d7-4a87-8419-8109ef404d0a' })
  @IsUUID()
  tripId!: string;

  @ApiProperty({ minimum: 1, maximum: 8, default: 1, example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  seats: number = 1;
}
