import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantConnectionService } from '../../common/database/tenant-connection.service';
import { OtpService } from './otp.service';
import * as crypto from 'crypto';

interface SchoolUserRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  is_active: boolean;
}

/**
 * School auth service — handles phone OTP login for school users.
 * Issues a simple JWT-like token (cryptographically signed).
 */
@Injectable()
export class SchoolAuthService {
  private readonly logger = new Logger(SchoolAuthService.name);
  private readonly tokenSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly otpService: OtpService,
  ) {
    this.tokenSecret = this.configService.get<string>('JWT_SECRET', 'dev-secret-change-me');
  }

  /**
   * Step 1: Send OTP to the phone number.
   * Verifies the user exists in this tenant before sending.
   */
  async sendOtp(phone: string): Promise<{ message: string }> {
    const { rows } = await this.tenantConnection.query<SchoolUserRow>(
      `SELECT id, name, phone, role, is_active FROM users WHERE phone = $1 LIMIT 1`,
      [phone],
    );

    if (rows.length === 0) {
      throw new NotFoundException('No user found with this phone number');
    }

    if (!rows[0].is_active) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    await this.otpService.generateOtp(phone);

    return { message: 'OTP sent successfully' };
  }

  /**
   * Step 2: Verify OTP and issue token.
   */
  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<{
    token: string;
    user: { id: string; name: string; phone: string; email: string | null; role: string };
  }> {
    const isValid = await this.otpService.verifyOtp(phone, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const { rows } = await this.tenantConnection.query<SchoolUserRow>(
      `SELECT id, name, phone, email, role, is_active FROM users WHERE phone = $1 LIMIT 1`,
      [phone],
    );

    if (rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = rows[0];
    if (!user.is_active) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    // Update last login
    await this.tenantConnection.query(
      `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [user.id],
    );

    // Generate a simple signed token
    const token = this.generateToken(user);

    this.logger.log(`User ${user.name} (${user.role}) logged in`);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Decode and verify a token, returning the user payload.
   */
  verifyToken(token: string): {
    userId: string;
    phone: string;
    role: string;
    tenantSchema: string;
  } | null {
    try {
      const [payloadB64, signature] = token.split('.');
      if (!payloadB64 || !signature) return null;

      const expectedSig = crypto
        .createHmac('sha256', this.tokenSecret)
        .update(payloadB64)
        .digest('hex');

      if (signature !== expectedSig) return null;

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as {
        userId: string;
        phone: string;
        role: string;
        tenantSchema: string;
        exp?: number;
      };

      // Check expiration (24 hours)
      if (payload.exp && Date.now() > payload.exp) return null;

      return payload;
    } catch {
      return null;
    }
  }

  private generateToken(user: SchoolUserRow): string {
    const payload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      tenantSchema: this.tenantConnection.getSchemaName(),
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.tokenSecret)
      .update(payloadB64)
      .digest('hex');

    return `${payloadB64}.${signature}`;
  }
}
