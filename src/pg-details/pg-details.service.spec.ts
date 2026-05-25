import { Test, TestingModule } from '@nestjs/testing';
import { PgDetailsService } from './pg-details.service';

describe('PgDetailsService', () => {
  let service: PgDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PgDetailsService],
    }).compile();

    service = module.get<PgDetailsService>(PgDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
