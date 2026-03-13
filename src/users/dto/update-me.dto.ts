import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Marie' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.roulii.app/photos/user.jpg' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  photoUrl?: string;
}
