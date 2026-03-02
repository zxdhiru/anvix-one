import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantConnectionService } from '../../common/database/tenant-connection.service';

export interface UserRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly tenantConnection: TenantConnectionService) {}

  async findAll(): Promise<UserRow[]> {
    const { rows } = await this.tenantConnection.query<UserRow>(
      `SELECT id, name, phone, email, role, is_active, last_login_at, created_at, updated_at
       FROM users ORDER BY created_at DESC`,
    );
    return rows;
  }

  async findOne(id: string): Promise<UserRow> {
    const { rows } = await this.tenantConnection.query<UserRow>(
      `SELECT id, name, phone, email, role, is_active, last_login_at, created_at, updated_at
       FROM users WHERE id = $1`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('User not found');
    return rows[0];
  }

  async findByPhone(phone: string): Promise<UserRow | null> {
    const { rows } = await this.tenantConnection.query<UserRow>(
      `SELECT id, name, phone, email, role, is_active, last_login_at, created_at, updated_at
       FROM users WHERE phone = $1`,
      [phone],
    );
    return rows[0] ?? null;
  }

  async create(data: {
    name: string;
    phone: string;
    email?: string;
    role: string;
  }): Promise<UserRow> {
    // Check for duplicate phone
    const existing = await this.findByPhone(data.phone);
    if (existing) {
      throw new ConflictException('A user with this phone number already exists');
    }

    const { rows } = await this.tenantConnection.query<UserRow>(
      `INSERT INTO users (name, phone, email, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, phone, email, role, is_active, last_login_at, created_at, updated_at`,
      [data.name, data.phone, data.email ?? null, data.role],
    );

    this.logger.log(`Created user: ${rows[0].name} (${rows[0].role})`);

    // Assign the matching role from the roles table
    await this.assignDefaultRole(rows[0].id, data.role);

    return rows[0];
  }

  async update(
    id: string,
    data: { name?: string; phone?: string; email?: string; role?: string; isActive?: boolean },
  ): Promise<UserRow> {
    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.phone !== undefined) {
      setClauses.push(`phone = $${paramIndex++}`);
      params.push(data.phone);
    }
    if (data.email !== undefined) {
      setClauses.push(`email = $${paramIndex++}`);
      params.push(data.email);
    }
    if (data.role !== undefined) {
      setClauses.push(`role = $${paramIndex++}`);
      params.push(data.role);
    }
    if (data.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }

    if (setClauses.length === 0) {
      return this.findOne(id);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(id);

    const { rows } = await this.tenantConnection.query<UserRow>(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, name, phone, email, role, is_active, last_login_at, created_at, updated_at`,
      params,
    );

    if (rows.length === 0) throw new NotFoundException('User not found');
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    const { rowCount } = await this.tenantConnection.query(`DELETE FROM users WHERE id = $1`, [id]);
    if (rowCount === 0) throw new NotFoundException('User not found');
    this.logger.log(`Deleted user: ${id}`);
  }

  private async assignDefaultRole(userId: string, roleName: string): Promise<void> {
    try {
      await this.tenantConnection.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, id FROM roles WHERE name = $2
         ON CONFLICT DO NOTHING`,
        [userId, roleName],
      );
    } catch (error) {
      this.logger.warn(`Could not assign role ${roleName} to user ${userId}: ${error}`);
    }
  }
}
