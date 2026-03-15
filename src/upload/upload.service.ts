import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client?: S3Client;
  private readonly bucket?: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = configService.get<string>('AWS_S3_BUCKET');

    if (accessKeyId && secretAccessKey && this.bucket) {
      this.s3Client = new S3Client({
        region: configService.get<string>('AWS_REGION') ?? 'eu-west-1',
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.logger.warn(
        'S3 non configuré (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET manquants)',
      );
    }
  }

  async getPresignedUrl(
    userId: string,
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    if (!this.s3Client || !this.bucket) {
      throw new ServiceUnavailableException('Service upload non configuré');
    }

    const ext = filename.split('.').pop()!.toLowerCase();
    const key = `profiles/${userId}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 300,
    });

    const region = this.configService.get<string>('AWS_REGION') ?? 'eu-west-1';
    const publicUrl = `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;

    return { uploadUrl, publicUrl, key };
  }
}
