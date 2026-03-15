import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { UploadService } from './upload.service';

type AuthenticatedRequest = Request & { user: JwtPayload };

@ApiTags('upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  @ApiOperation({
    summary: 'Obtenir une URL pré-signée S3 pour uploader une photo de profil',
  })
  getPresignedUrl(
    @Req() request: AuthenticatedRequest,
    @Body() dto: PresignedUrlDto,
  ) {
    return this.uploadService.getPresignedUrl(
      request.user.sub,
      dto.filename,
      dto.contentType,
    );
  }
}
