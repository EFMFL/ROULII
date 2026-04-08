import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  health() {
    return {
      status: 'ok',
      service: 'roulii-backend',
      timestamp: new Date().toISOString(),
    };
  }

  async readiness() {
    const [databaseOk, redisOk] = await Promise.all([
      this.checkDatabase(),
      this.redisService.ping(),
    ]);

    return {
      status: databaseOk ? 'ready' : 'degraded',
      service: 'roulii-backend',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: databaseOk,
        redis: redisOk,
      },
      providers: {
        stripe: Boolean(this.configService.get<string>('STRIPE_SECRET_KEY')),
        twilio: Boolean(
          this.configService.get<string>('TWILIO_ACCOUNT_SID') &&
          this.configService.get<string>('TWILIO_AUTH_TOKEN'),
        ),
        firebase: Boolean(
          this.configService.get<string>('FIREBASE_PROJECT_ID') &&
          this.configService.get<string>('FIREBASE_CLIENT_EMAIL') &&
          this.configService.get<string>('FIREBASE_PRIVATE_KEY'),
        ),
        smtp: Boolean(
          this.configService.get<string>('SMTP_HOST') &&
          this.configService.get<string>('SMTP_USER') &&
          this.configService.get<string>('SMTP_PASS') &&
          this.configService.get<string>('SMTP_FROM_EMAIL'),
        ),
      },
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
