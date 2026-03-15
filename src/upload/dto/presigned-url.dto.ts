import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

export class PresignedUrlDto {
  @ApiProperty({
    example: 'avatar.jpg',
    description: 'Nom du fichier original (extension jpg, jpeg, png ou webp)',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$/i, {
    message: 'Nom de fichier invalide (jpg, jpeg, png, webp uniquement)',
  })
  filename!: string;

  @ApiProperty({
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp'],
  })
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: string;
}
