import { Test, TestingModule } from '@nestjs/testing';
import { PlatformHealthService } from './platform-health.service';

describe('PlatformHealthService', () => {
  let service: PlatformHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformHealthService],
    }).compile();

    service = module.get<PlatformHealthService>(PlatformHealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return health check with correct structure', () => {
    const result = service.check();
    expect(result).toEqual({
      status: 'ok',
      system: 'platform',
      timestamp: expect.any(String),
    });
  });

  it('should return a valid ISO timestamp', () => {
    const result = service.check();
    const parsed = new Date(result.timestamp);
    expect(parsed.toISOString()).toBe(result.timestamp);
  });
});
