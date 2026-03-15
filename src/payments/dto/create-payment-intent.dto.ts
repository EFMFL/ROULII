import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'f2b316df-99d7-4a87-8419-8109ef404d0a' })
  @IsUUID()
  bookingId!: string;
}
