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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ServiceReviewsQueryDto } from './dto/reviews.dto';

@Controller('reviews')
@ApiTags('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** POST /reviews — Customer tạo đánh giá */
  @Post()
  @ApiOperation({
    summary: 'Customer creates a review for a completed booking',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CUSTOMER')
  async create(
    @CurrentUser('id') userId: number,
    @Body() body: CreateReviewDto,
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
  @ApiOperation({ summary: 'List public reviews for a service' })
  async getServiceReviews(
    @Param('serviceId', ParseIntPipe) serviceId: number,
    @Query() query: ServiceReviewsQueryDto,
  ) {
    return this.reviewsService.getServiceReviews(
      serviceId,
      query.rating,
      query.page,
      query.limit,
    );
  }
}
