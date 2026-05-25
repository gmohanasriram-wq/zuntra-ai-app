import { Test, TestingModule } from '@nestjs/testing';
import { PgDetailsController } from './pg-details.controller';
import { PgDetailsService } from './pg-details.service';

describe('PgDetailsController', () => {
  let controller: PgDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PgDetailsController],
      providers: [PgDetailsService],
    }).compile();

    controller = module.get<PgDetailsController>(PgDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
