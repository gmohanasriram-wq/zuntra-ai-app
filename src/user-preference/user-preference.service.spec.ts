import { Test, TestingModule } from '@nestjs/testing';
import { UserPreferenceService } from './user-preference.service';

describe('UserPreferenceService', () => {
  let service: UserPreferenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserPreferenceService],
    }).compile();

    service = module.get<UserPreferenceService>(UserPreferenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
