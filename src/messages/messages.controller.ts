import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { MessageService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // Create message
  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.messageService.createMessage(dto);
  }

  // Get messages by property
  @Get('property/:propertyId')
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.messageService.getByProperty(Number(propertyId));
  }

  // Get all messages
  @Get()
  findAll() {
    return this.messageService.getAllMessages();
  }

  // Delete message
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.deleteMessage(Number(id));
  }
}