import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class UpdateFcmTokenDto {
  @ApiProperty()
  @IsString()
  @Length(20, 4096)
  token!: string;
}
