import { Test, TestingModule } from '@nestjs/testing';
import { UserPreferenceController } from './user-preference.controller';
import { UserPreferenceService } from './user-preference.service';

describe('UserPreferenceController', () => {
  let controller: UserPreferenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserPreferenceController],
      providers: [UserPreferenceService],
    }).compile();

    controller = module.get<UserPreferenceController>(UserPreferenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
