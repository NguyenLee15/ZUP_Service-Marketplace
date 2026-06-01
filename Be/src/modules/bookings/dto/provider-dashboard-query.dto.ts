import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ProviderDashboardQueryDto {
  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsString()
  @IsOptional()
  groupBy?: 'day' | 'week' | 'month';

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  reportType?: 'overview' | 'revenue' | 'status' | 'bookings';

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  serviceId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;
}
