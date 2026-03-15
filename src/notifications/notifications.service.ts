import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp?: admin.app.App;

  constructor(private readonly configService: ConfigService) {
    const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');

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
}
