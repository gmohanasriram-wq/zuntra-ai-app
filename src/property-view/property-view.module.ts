import { Module } from '@nestjs/common';
import { PropertyViewService } from './property-view.service';
import { PropertyViewController } from './property-view.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // ✅ THIS IS REQUIRED
  controllers: [PropertyViewController],
  providers: [PropertyViewService],
})
export class PropertyViewModule {}