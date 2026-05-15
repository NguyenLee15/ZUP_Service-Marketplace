import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

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
}

export class ConfirmSurveyorDto {
  @IsString()
  @MaxLength(100)
  surveyorName: string;

  @IsString()
  @MaxLength(15)
  surveyorPhone: string;
}

export class SendQuoteDto {
  @IsNumber()
  @Type(() => Number)
  actualPrice: number;

  @IsString()
  @MaxLength(100)
  estimatedTime: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CancelBookingDto {
  @IsString()
  reason: string;
}

export class RejectQuoteDto {
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
