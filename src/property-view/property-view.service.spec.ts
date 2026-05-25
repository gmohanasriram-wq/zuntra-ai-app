import { Test, TestingModule } from '@nestjs/testing';
import { PropertyViewService } from './property-view.service';

describe('PropertyViewService', () => {
  let service: PropertyViewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyViewService],
    }).compile();

    service = module.get<PropertyViewService>(PropertyViewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
