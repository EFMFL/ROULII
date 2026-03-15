import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'f2b316df-99d7-4a87-8419-8109ef404d0a' })
  @IsUUID()
  bookingId!: string;

  @ApiProperty({ example: "Je serai à l'arrêt de bus Nationale à 15h00" })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;
}
