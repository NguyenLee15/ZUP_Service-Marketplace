import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  MaxLength,
  Max,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @Type(() => Number)
  referencePrice: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceItemDto)
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
