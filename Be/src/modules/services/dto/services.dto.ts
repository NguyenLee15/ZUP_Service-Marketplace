import {
  IsIn,
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  MaxLength,
  Max,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { FeaturedListingStatus } from '@prisma/client';

export class CreateServiceItemDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(20)
  unit: string;

  @IsNumber()
  @Type(() => Number)
  price: number;
}

export class CreateServiceDto {
  @IsInt()
  categoryId: number;

  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  referencePrice?: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 dịch vụ con (hạng mục)' })
  @ValidateNested({ each: true })
  @Type(() => CreateServiceItemDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return plainToInstance(CreateServiceItemDto, parsed);
        }
        return parsed;
      } catch {
        return value;
      }
    }
    return value;
  })
  items?: CreateServiceItemDto[];
}

export class UpdateServiceDto {
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  referencePrice?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceItemDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return plainToInstance(CreateServiceItemDto, parsed);
        }
        return parsed;
      } catch {
        return value;
      }
    }
    return value;
  })
  items?: CreateServiceItemDto[];
}

export class SearchServiceDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsString()
  @IsOptional()
  categoryIds?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(-90)
  @Max(90)
  lat?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(-180)
  @Max(180)
  lng?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  radiusKm?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minRating?: number;

  @IsString()
  @IsOptional()
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'newest';

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class AdminRejectDto {
  @IsString()
  reason: string;
}

export class AdminHideDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

export class AiSearchDto {
  @IsString()
  query: string;
}

export class AdminServicesQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PurchaseFeaturedListingDto {
  @IsInt()
  @Type(() => Number)
  @IsIn([1, 3, 7])
  days: number;
}

export class AdminFeaturedListingsQueryDto {
  @IsString()
  @IsOptional()
  @IsIn(Object.values(FeaturedListingStatus))
  status?: FeaturedListingStatus;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  serviceId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  providerId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdateFeaturedRateDto {
  @IsNumber()
  @Type(() => Number)
  @Min(1000)
  @Max(10000000)
  dailyRate: number;
}

export class PublicProviderServicesQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  sortBy?: 'rating' | 'priceAsc' | 'priceDesc' | 'newest';
}
