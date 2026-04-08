import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import Twilio from 'twilio';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly isProduction: boolean;
  private firebaseApp?: admin.app.App;
  private twilioClient?: ReturnType<typeof Twilio>;
  private twilioMessagingServiceSid?: string;
  private twilioFromPhone?: string;
  private emailTransporter?: nodemailer.Transporter;
  private smtpFromEmail?: string;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
    const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');
    const twilioSid = configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioToken = configService.get<string>('TWILIO_AUTH_TOKEN');

    this.twilioMessagingServiceSid = configService.get<string>(
      'TWILIO_MESSAGING_SERVICE_SID',
    );
    this.twilioFromPhone = configService.get<string>('TWILIO_FROM_PHONE');

    if (twilioSid && twilioToken) {
      this.twilioClient = Twilio(twilioSid, twilioToken);
    } else {
      this.logger.warn('SMS non configuré (Twilio manquant)');
    }

    const smtpHost = configService.get<string>('SMTP_HOST');
    const smtpUser = configService.get<string>('SMTP_USER');
    const smtpPass = configService.get<string>('SMTP_PASS');
    const smtpPort = Number(configService.get<number>('SMTP_PORT') ?? 587);
    const smtpSecure =
      String(configService.get<string>('SMTP_SECURE') ?? 'false') === 'true';
    this.smtpFromEmail = configService.get<string>('SMTP_FROM_EMAIL');

    if (smtpHost && smtpUser && smtpPass && this.smtpFromEmail) {
      this.emailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else {
      this.logger.warn('Email non configuré (SMTP incomplet)');
    }

    if (projectId && clientEmail && privateKey) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      this.logger.warn(
        'Firebase non configuré (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY manquants)',
      );
    }
  }

  async sendToToken(fcmToken: string, payload: PushPayload): Promise<void> {
    if (!this.firebaseApp) {
      if (this.isProduction) {
        throw new ServiceUnavailableException(
          'Provider push indisponible: Firebase non configuré',
        );
      }

      this.logger.debug(
        `[FCM mock] token=${fcmToken.slice(0, 10)}... title="${payload.title}"`,
      );
      return;
    }

    try {
      await admin.messaging(this.firebaseApp).send({
        token: fcmToken,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `FCM send failed for token ${fcmToken.slice(0, 10)}...: ${msg}`,
      );
    }
  }

  async sendToMany(fcmTokens: string[], payload: PushPayload): Promise<void> {
    await Promise.allSettled(
      fcmTokens.map((token) => this.sendToToken(token, payload)),
    );
  }

  async sendSms(phone: string, message: string): Promise<void> {
    if (!this.twilioClient) {
      if (this.isProduction) {
        throw new ServiceUnavailableException(
          'Provider SMS indisponible: Twilio non configuré',
        );
      }

      this.logger.debug(`[SMS mock] to=${phone} message="${message}"`);
      return;
    }

    try {
      await this.twilioClient.messages.create({
        to: phone,
        body: message,
        messagingServiceSid: this.twilioMessagingServiceSid || undefined,
        from: this.twilioFromPhone || undefined,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`SMS send failed to ${phone}: ${msg}`);
    }
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    if (!this.emailTransporter || !this.smtpFromEmail) {
      if (this.isProduction) {
        throw new ServiceUnavailableException(
          'Provider email indisponible: SMTP non configuré',
        );
      }

      this.logger.debug(`[EMAIL mock] to=${to} subject="${subject}"`);
      return;
    }

    try {
      await this.emailTransporter.sendMail({
        from: this.smtpFromEmail,
        to,
        subject,
        text,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Email send failed to ${to}: ${msg}`);
    }
  }
}
