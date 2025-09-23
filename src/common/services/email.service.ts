import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('EMAIL_SERVICE_ADDRESS'),
        pass: this.configService.get<string>('EMAIL_SERVICE_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html: string) {
    try {
      this.logger.log(`Email service: Sending email to ${to} with subject "${subject}"`);
      await this.transporter.sendMail({
        from: `IoT Bridge Aplication <${this.configService.get<string>('EMAIL_SERVICE_ADDRESS')}>`,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      this.logger.error(`Email service: Failed to send email to ${to}`, error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
