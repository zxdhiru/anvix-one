import { Test, TestingModule } from '@nestjs/testing';
import { SchoolHealthService } from './school-health.service';

describe('SchoolHealthService', () => {
  let service: SchoolHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SchoolHealthService],
    }).compile();

    service = module.get<SchoolHealthService>(SchoolHealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health check with correct structure', () => {
    const result = service.check();
    expect(result).toEqual({
      status: 'ok',
      system: 'school',
      timestamp: expect.any(String),
    });
  });

  it('should return a valid ISO timestamp', () => {
    const result = service.check();
    const parsed = new Date(result.timestamp);
    expect(parsed.toISOString()).toBe(result.timestamp);
  });
});
