import { Test, TestingModule } from '@nestjs/testing';
import { PlatformHealthController } from './platform-health.controller';
import { PlatformHealthService } from './platform-health.service';

describe('PlatformHealthController', () => {
  let controller: PlatformHealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformHealthController],
      providers: [PlatformHealthService],
    }).compile();

    controller = module.get<PlatformHealthController>(PlatformHealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return platform health status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.system).toBe('platform');
    expect(result.timestamp).toBeDefined();
  });
});
