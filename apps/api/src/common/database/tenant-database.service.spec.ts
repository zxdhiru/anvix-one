import { Test, TestingModule } from '@nestjs/testing';
import { TenantDatabaseService } from './tenant-database.service';
import { DatabaseService } from './database.service';

describe('TenantDatabaseService', () => {
  let service: TenantDatabaseService;

  beforeEach(async () => {
    const mockDatabaseService = {
      db: {
        execute: jest.fn().mockResolvedValue({ rows: [] }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantDatabaseService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<TenantDatabaseService>(TenantDatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSchemaName', () => {
    it('should generate schema name from slug', () => {
      expect(service.getSchemaName('dps-bangalore')).toBe('tenant_dps_bangalore');
    });

    it('should sanitize special characters', () => {
      expect(service.getSchemaName("st-mary's")).toBe('tenant_st_mary_s');
    });

    it('should handle simple slugs', () => {
      expect(service.getSchemaName('school123')).toBe('tenant_school123');
    });
  });

  describe('schemaExists', () => {
    it('should return false when schema does not exist', async () => {
      const exists = await service.schemaExists('nonexistent');
      expect(exists).toBe(false);
    });
  });
});
