import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { VisitService } from './visits.service';

@Controller('visits')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Post()
  create(@Body() data: any) {
    return this.visitService.create(data);
  }

  @Get()
  findAll() {
    return this.visitService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.visitService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.visitService.remove(+id);
  }
}