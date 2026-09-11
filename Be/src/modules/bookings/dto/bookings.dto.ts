import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  MaxLength,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  MinLength,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import {
  Type,
  Transform,
  plainToInstance,
  type ClassConstructor,
} from 'class-transformer';

function parseJsonArrayValue<T>(
  value: unknown,
  classType?: ClassConstructor<T>,
): unknown {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return value;
    }
  }
  if (classType && Array.isArray(parsed)) {
    return (parsed as unknown[]).map((item) =>
      plainToInstance(classType, item),
    );
  }
  return parsed;
}

export class CreateBookingItemDto {
  @IsInt()
  serviceItemId!: number;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateBookingDto {
  @IsInt()
  serviceId!: number;

  @IsString()
  description!: string;

  @IsString()
  @MaxLength(50)
  province!: string;

  @IsString()
  @MaxLength(50)
  district!: string;

  @IsString()
  @MaxLength(50)
  ward!: string;

  @IsString()
  addressDetail!: string;

  @IsDateString()
  desiredTime!: string;

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
  surveyorName!: string;

  @IsString()
  @MaxLength(15)
  surveyorPhone!: string;
}

export class CreateQuotationItemDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(20)
  unit!: string;

  @IsNumber()
  @Type(() => Number)
  price!: number;

  @IsInt()
  quantity!: number;
}

export class SendQuoteDto {
  @IsString()
  @MaxLength(100)
  estimatedTime!: string;

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
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}

export class RejectQuoteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}

export class SendSupplementaryQuoteDto {
  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @Transform(({ value }) => parseJsonArrayValue(value, CreateQuotationItemDto))
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items!: CreateQuotationItemDto[];
}

export class ConfirmSupplementaryDto {}

export class RejectSupplementaryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}

export class DisputeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}

export class ResolveDisputeDto {
  @IsIn(['COMPLETE', 'PENALIZE'])
  resolutionAction!: 'COMPLETE' | 'PENALIZE';

  @IsString()
  @IsNotEmpty()
  resolutionReason!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  penaltyAmount?: number;
}
