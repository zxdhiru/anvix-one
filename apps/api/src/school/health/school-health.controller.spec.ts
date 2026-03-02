import { Test, TestingModule } from '@nestjs/testing';
import { SchoolHealthController } from './school-health.controller';
import { SchoolHealthService } from './school-health.service';

describe('SchoolHealthController', () => {
  let controller: SchoolHealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchoolHealthController],
      providers: [SchoolHealthService],
    }).compile();

    controller = module.get<SchoolHealthController>(SchoolHealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return school health status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.system).toBe('school');
    expect(result.timestamp).toBeDefined();
  });
});
