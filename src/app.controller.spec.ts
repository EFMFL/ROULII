import { Test } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = testingModule.get<AppController>(AppController);
  });

  it('should return a healthy status', () => {
    const result = appController.health();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('roulii-backend');
    expect(result.timestamp).toBeDefined();
  });
});
