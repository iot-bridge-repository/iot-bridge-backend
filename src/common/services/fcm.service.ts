import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import * as path from 'path';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private readonly projectId: string;
  private readonly serviceAccountKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.projectId = this.configService.get<string>('FIREBASE_PROJECT_ID') ?? '';
    this.serviceAccountKey = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_KEY') ?? '';
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    // Create a new GoogleAuth instance and get a new access token
    const auth = new GoogleAuth({
      keyFile: path.join(__dirname, '..', '..', '..', 'firebase', `${this.serviceAccountKey}`),
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    const client = await auth.getClient();
    const tokenInfo = await client.getAccessToken();

    this.accessToken = tokenInfo.token ?? '';
    this.tokenExpiry = now + 55 * 60 * 1000;
    return this.accessToken;
  }

  async sendMobileNotification(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.post(
        `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
        {
          message: {
            topic: userId,
            notification: { title, body },
            data: data ?? {},
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Successfully sent FCM notification to user`, JSON.stringify(response));
    } catch (error) {
      this.logger.error(`❌ Failed to send notification to user with id ${userId}.`, error);
    }
  }
}
