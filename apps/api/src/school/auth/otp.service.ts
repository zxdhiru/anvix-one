import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/database/redis.service';
import { MailService } from '../../common/database/mail.service';

const OTP_PREFIX = 'otp:';
const OTP_TTL_SECONDS = 300; // 5 minutes

/**
 * OTP service — generates, stores (Redis), and verifies 6-digit OTPs.
 * In development, sends OTP via email (Mailhog).
 * In production, will send via MSG91 SMS gateway.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Generate and store a 6-digit OTP for the given identifier (email).
   * Sends the OTP via email using Mailhog in development.
   */
  async generateOtp(identifier: string, email?: string): Promise<string> {
    const otp = this.generateSixDigitOtp();
    const key = `${OTP_PREFIX}${identifier}`;

    await this.redisService.set(key, otp, OTP_TTL_SECONDS);

    // Send OTP via email
    const targetEmail = email ?? identifier;
    try {
      await this.mailService.sendOtpEmail(targetEmail, otp);
      this.logger.log(`OTP email sent to ${targetEmail}`);
    } catch {
      // Still log for dev convenience even if email fails
      this.logger.warn(`Email delivery failed, OTP for ${identifier}: ${otp}`);
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[DEV] OTP for ${identifier}: ${otp}`);
    }

    return otp;
  }

  /**
   * Verify the OTP for the given identifier.
   * Deletes the OTP on successful verification (one-time use).
   */
  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    const key = `${OTP_PREFIX}${identifier}`;
    const storedOtp = await this.redisService.get(key);

    if (!storedOtp) {
      this.logger.warn(`OTP expired or not found for ${identifier}`);
      return false;
    }

    if (storedOtp !== otp) {
      this.logger.warn(`Invalid OTP attempt for ${identifier}`);
      return false;
    }

    // OTP matched — delete it (one-time use)
    await this.redisService.del(key);
    this.logger.log(`OTP verified for ${identifier}`);
    return true;
  }

  private generateSixDigitOtp(): string {
    // Cryptographically random 6-digit OTP
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return String(array[0] % 1000000).padStart(6, '0');
  }
}
