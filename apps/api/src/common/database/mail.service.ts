import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Mail service — sends emails via SMTP.
 * In development, uses Mailhog (localhost:1025).
 * In production, configure a real SMTP provider.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = this.configService.get<number>('SMTP_PORT', 1025);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // Mailhog doesn't use TLS
      // No auth needed for Mailhog
    });

    this.logger.log(`Mail transport configured: ${host}:${port}`);
  }

  /**
   * Send an OTP email to the specified address.
   */
  async sendOtpEmail(to: string, otp: string): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM', 'noreply@anvixone.in');

    try {
      await this.transporter.sendMail({
        from: `"Anvix One" <${from}>`,
        to,
        subject: `Your login OTP: ${otp}`,
        text: `Your Anvix One login OTP is: ${otp}\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto;">
            <h2 style="color: #1a1a2e; margin-bottom: 10px;">Anvix One</h2>
            <p style="color: #333;">Your login OTP is:</p>
            <div style="background: #f0f4ff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This code expires in 5 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });

      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}: ${error}`);
      throw error;
    }
  }
}
