import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function parseOptionalBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class NotificationsQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page = 1;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit = 20;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  isRead?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  type?: string;
}
