import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateReviewDto {
  @IsInt()
  @Type(() => Number)
  bookingId: number;

  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;
}

export class ServiceReviewsQueryDto extends PaginationQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  rating?: number;
}
