import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** POST /reviews — Customer tạo đánh giá */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  async create(
    @CurrentUser('id') userId: number,
    @Body() body: { bookingId: number; rating: number; comment?: string },
  ) {
    return this.reviewsService.createReview(
      userId,
      body.bookingId,
      body.rating,
      body.comment,
    );
  }

  /** GET /reviews/service/:serviceId — Public */
  @Get('service/:serviceId')
  async getServiceReviews(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query('rating') rating?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewsService.getServiceReviews(
      serviceId,
      rating ? parseInt(rating) : undefined,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }
}
