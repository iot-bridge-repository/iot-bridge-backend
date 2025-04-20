import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_SERVICE_ADDRESS'),
        pass: this.configService.get<string>('EMAIL_SERVICE_PASSWORD'),
      },
    });
  }

  async sendEmail(to: string, subject: string, text: string, html: string) {
    await this.transporter.sendMail({
      from: `IoT Bridge Aplication <${this.configService.get<string>('EMAIL_SERVICE_ADDRESS')}>`,
      to,
      subject,
      text,
      html,
    });
  }
}
