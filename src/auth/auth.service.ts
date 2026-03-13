import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Twilio from 'twilio';
import {
  OTP_BLOCK_TTL_SECONDS,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_SECONDS,
} from './constants';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly twilioClient?: ReturnType<typeof Twilio>;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const sid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const token = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (sid && token) {
      this.twilioClient = Twilio(sid, token);
    }
  }

  async sendOtp(sendOtpDto: SendOtpDto): Promise<{ expiresInSeconds: number }> {
    const phone = this.normalizePhone(sendOtpDto.phone);

    await this.ensureNotBlocked(phone);

    const otp = this.generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await this.redisService.set(this.otpKey(phone), otpHash, OTP_TTL_SECONDS);
    await this.redisService.del(this.otpAttemptsKey(phone));

    await this.dispatchOtp(phone, otp);

    return { expiresInSeconds: OTP_TTL_SECONDS };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const phone = this.normalizePhone(verifyOtpDto.phone);

    await this.ensureNotBlocked(phone);

    const otpHash = await this.redisService.get(this.otpKey(phone));
    if (!otpHash) {
      throw new UnauthorizedException('Code OTP expiré ou invalide');
    }

    const isValid = await bcrypt.compare(verifyOtpDto.code, otpHash);
    if (!isValid) {
      await this.registerFailedOtpAttempt(phone);
      throw new UnauthorizedException('Code OTP invalide');
    }

    await this.redisService.del(this.otpKey(phone));
    await this.redisService.del(this.otpAttemptsKey(phone));

    let user = await this.prismaService.user.findUnique({ where: { phone } });

    if (!user) {
      user = await this.prismaService.user.create({
        data: {
          phone,
          firstName: verifyOtpDto.firstName ?? 'Nouveau membre',
        },
      });
    }

    const tokens = await this.issueTokens(user.id, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        photoUrl: user.photoUrl,
        reliabilityScore: user.reliabilityScore,
        role: user.role,
      },
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = refreshTokenDto.refreshToken;

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Session invalide');
    }

    const isTokenMatching = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!isTokenMatching) {
      throw new UnauthorizedException('Session invalide');
    }

    const tokens = await this.issueTokens(user.id, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string): Promise<{ success: true }> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { success: true };
  }

  private async issueTokens(userId: string, role: UserRole) {
    const payload: JwtPayload = { sub: userId, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.parseJwtExpiresIn(
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
        15 * 60,
      ),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.parseJwtExpiresIn(
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
        30 * 24 * 60 * 60,
      ),
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    return { accessToken, refreshToken };
  }

  private async ensureNotBlocked(phone: string): Promise<void> {
    const isBlocked = await this.redisService.exists(this.otpBlockedKey(phone));
    if (isBlocked) {
      throw new HttpException(
        'Trop de tentatives OTP, réessaie dans 30 minutes',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async registerFailedOtpAttempt(phone: string): Promise<void> {
    const attempts = await this.redisService.incr(this.otpAttemptsKey(phone));

    if (attempts === 1) {
      await this.redisService.expire(
        this.otpAttemptsKey(phone),
        OTP_TTL_SECONDS,
      );
    }

    if (attempts >= OTP_MAX_ATTEMPTS) {
      await this.redisService.set(
        this.otpBlockedKey(phone),
        '1',
        OTP_BLOCK_TTL_SECONDS,
      );
      await this.redisService.del(this.otpKey(phone));
      await this.redisService.del(this.otpAttemptsKey(phone));
      throw new HttpException(
        'Trop de tentatives OTP, réessaie dans 30 minutes',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async dispatchOtp(phone: string, otp: string): Promise<void> {
    const messagingServiceSid = this.configService.get<string>(
      'TWILIO_MESSAGING_SERVICE_SID',
    );
    const fromPhone = this.configService.get<string>('TWILIO_FROM_PHONE');

    if (!this.twilioClient || (!messagingServiceSid && !fromPhone)) {
      if (this.configService.get<string>('NODE_ENV') !== 'production') {
        this.logger.log(`OTP debug mode for ${this.maskPhone(phone)}: ${otp}`);
        return;
      }
      throw new BadRequestException('Provider SMS OTP non configuré');
    }

    await this.twilioClient.messages.create({
      to: phone,
      body: `Roulii: votre code OTP est ${otp}. Il expire dans 5 minutes.`,
      messagingServiceSid: messagingServiceSid || undefined,
      from: fromPhone || undefined,
    });
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\s+/g, '');
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private otpKey(phone: string): string {
    return `otp:code:${phone}`;
  }

  private otpAttemptsKey(phone: string): string {
    return `otp:attempts:${phone}`;
  }

  private otpBlockedKey(phone: string): string {
    return `otp:blocked:${phone}`;
  }

  private maskPhone(phone: string): string {
    if (phone.length < 4) {
      return '***';
    }
    return `${'*'.repeat(phone.length - 2)}${phone.slice(-2)}`;
  }

  private parseJwtExpiresIn(
    value: string | undefined,
    fallbackSeconds: number,
  ) {
    if (!value) {
      return fallbackSeconds;
    }

    const normalized = value.trim().toLowerCase();

    if (/^\d+$/.test(normalized)) {
      return Number(normalized);
    }

    if (/^\d+m$/.test(normalized)) {
      return Number(normalized.slice(0, -1)) * 60;
    }

    if (/^\d+h$/.test(normalized)) {
      return Number(normalized.slice(0, -1)) * 60 * 60;
    }

    if (/^\d+d$/.test(normalized)) {
      return Number(normalized.slice(0, -1)) * 24 * 60 * 60;
    }

    return fallbackSeconds;
  }
}
