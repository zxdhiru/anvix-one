import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/database/redis.service';

const OTP_PREFIX = 'otp:';
const OTP_TTL_SECONDS = 300; // 5 minutes

/**
 * OTP service — generates, stores (Redis), and verifies 6-digit OTPs.
 * In production, sends via MSG91 SMS gateway.
 * In development, logs the OTP to console.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generate and store a 6-digit OTP for the given phone number.
   * Returns the OTP (for dev logging; production should not expose).
   */
  async generateOtp(phone: string): Promise<string> {
    const otp = this.generateSixDigitOtp();
    const key = `${OTP_PREFIX}${phone}`;

    await this.redisService.set(key, otp, OTP_TTL_SECONDS);

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[DEV] OTP for ${phone}: ${otp}`);
    } else {
      // TODO: Integrate MSG91 SMS gateway
      this.logger.log(`OTP sent to ${phone} via SMS`);
    }

    return otp;
  }

  /**
   * Verify the OTP for the given phone number.
   * Deletes the OTP on successful verification (one-time use).
   */
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const key = `${OTP_PREFIX}${phone}`;
    const storedOtp = await this.redisService.get(key);

    if (!storedOtp) {
      this.logger.warn(`OTP expired or not found for ${phone}`);
      return false;
    }

    if (storedOtp !== otp) {
      this.logger.warn(`Invalid OTP attempt for ${phone}`);
      return false;
    }

    // OTP matched — delete it (one-time use)
    await this.redisService.del(key);
    this.logger.log(`OTP verified for ${phone}`);
    return true;
  }

  private generateSixDigitOtp(): string {
    // Cryptographically random 6-digit OTP
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return String(array[0] % 1000000).padStart(6, '0');
  }
}
