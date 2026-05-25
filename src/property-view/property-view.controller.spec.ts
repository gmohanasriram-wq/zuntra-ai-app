import { Test, TestingModule } from '@nestjs/testing';
import { PropertyViewController } from './property-view.controller';
import { PropertyViewService } from './property-view.service';

describe('PropertyViewController', () => {
  let controller: PropertyViewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyViewController],
      providers: [PropertyViewService],
    }).compile();

    controller = module.get<PropertyViewController>(PropertyViewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
