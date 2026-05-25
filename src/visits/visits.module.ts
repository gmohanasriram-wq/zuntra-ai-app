import { Module } from '@nestjs/common';
import { VisitService } from './visits.service';
import { VisitController } from './visits.controller';

@Module({
  controllers: [VisitController],
  providers: [VisitService],
})
export class VisitModule {}