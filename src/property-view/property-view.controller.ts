import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { PropertyViewService } from './property-view.service';
import { CreatePropertyViewDto } from './dto/create-property-view.dto';

@Controller('property-view')
export class PropertyViewController {
  constructor(private readonly service: PropertyViewService) {}

  @Post()
  create(@Body() dto: CreatePropertyViewDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(Number(userId));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}