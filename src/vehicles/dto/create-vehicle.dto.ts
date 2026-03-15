import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Renault' })
  @IsString()
  @Length(1, 60)
  brand!: string;

  @ApiProperty({ example: 'Clio' })
  @IsString()
  @Length(1, 60)
  model!: string;

  @ApiProperty({ example: 'Noir' })
  @IsString()
  @Length(1, 40)
  color!: string;

  @ApiProperty({ example: 'AB-123-CD' })
  @IsString()
  @Length(5, 20)
  @Matches(/^[A-Za-z0-9- ]+$/)
  plate!: string;
}
