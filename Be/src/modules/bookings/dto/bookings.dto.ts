import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  MaxLength,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';

function parseJsonArrayValue(value: unknown, classType?: any): unknown {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return value;
    }
  }
  if (classType && Array.isArray(parsed)) {
    return parsed.map((item) => plainToInstance(classType, item));
  }
  return parsed;
}

export class CreateBookingItemDto {
  @IsInt()
  serviceItemId: number;

  @IsInt()
  quantity: number;
}

export class CreateBookingDto {
  @IsInt()
  serviceId: number;

  @IsString()
  description: string;

  @IsString()
  @MaxLength(50)
  province: string;

  @IsString()
  @MaxLength(50)
  district: string;

  @IsString()
  @MaxLength(50)
  ward: string;

  @IsString()
  addressDetail: string;

  @IsDateString()
  desiredTime: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => parseJsonArrayValue(value, CreateBookingItemDto))
  @ValidateNested({ each: true })
  @Type(() => CreateBookingItemDto)
  items?: CreateBookingItemDto[];
}

export class ConfirmSurveyorDto {
  @IsString()
  @MaxLength(100)
  surveyorName: string;

  @IsString()
  @MaxLength(15)
  surveyorPhone: string;
}

export class CreateQuotationItemDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(20)
  unit: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsInt()
  quantity: number;
}

export class SendQuoteDto {
  @IsString()
  @MaxLength(100)
  estimatedTime: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => parseJsonArrayValue(value, CreateQuotationItemDto))
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items?: CreateQuotationItemDto[];
}

export class CancelBookingDto {
  @IsString()
  reason: string;
}

export class RejectQuoteDto {
  @IsString()
  reason: string;
}

export class SendSupplementaryQuoteDto {
  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @Transform(({ value }) => parseJsonArrayValue(value, CreateQuotationItemDto))
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];
}

export class ConfirmSupplementaryDto {}

export class RejectSupplementaryDto {
  @IsString()
  reason: string;
}

export class DisputeDto {
  @IsString()
  reason: string;
}

export class ResolveDisputeDto {
  @IsString()
  resolutionAction: 'COMPLETE' | 'PENALIZE';

  @IsString()
  resolutionReason: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  penaltyAmount?: number;
}
