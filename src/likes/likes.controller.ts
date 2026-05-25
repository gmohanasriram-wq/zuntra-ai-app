import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { LikeService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  // Create Like
  @Post()
  create(@Body() dto: CreateLikeDto) {
    return this.likeService.createLike(dto);
  }

  // Get All Likes
  @Get()
  findAll() {
    return this.likeService.getAllLikes();
  }

  // Get Like By ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.likeService.getLikeById(Number(id));
  }

  // Get User Likes
  @Get('user/:userId')
  findUserLikes(@Param('userId') userId: string) {
    return this.likeService.getUserLikes(Number(userId));
  }

  // Delete Like
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.likeService.deleteLike(Number(id));
  }
}