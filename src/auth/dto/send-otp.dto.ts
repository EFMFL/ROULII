import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '+33612345678' })
  @IsPhoneNumber('FR')
  phone!: string;
}
