import {
  IsArray,
  IsInt,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ADMIN_PERMISSION_VALUES } from '../../../common/constants/admin-permissions';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AdminUsersQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  keyword?: string;
}

export class AdminStaffsQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  keyword?: string;
}

export class AdminAuditLogsQueryDto extends PaginationQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  actorId?: number;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  targetType?: string;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  targetId?: number;

  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;

  @IsString()
  @IsOptional()
  keyword?: string;
}

export class AdminStatusListQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  status?: string;
}

export class AdminBookingsQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  keyword?: string;
}

export class AdminDashboardQueryDto {
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

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  providerId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  serviceId?: number;
}

export class AdminReasonDto {
  @IsString()
  reason: string;
}

export class CreateStaffDto {
  @IsString()
  fullName: string;

  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  password: string;

  @IsArray()
  @IsString({ each: true })
  @IsIn(ADMIN_PERMISSION_VALUES, { each: true })
  @IsOptional()
  permissions?: string[];
}

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsString({ each: true })
  @IsIn(ADMIN_PERMISSION_VALUES, { each: true })
  @IsOptional()
  permissions?: string[];
}

export class UpdateCommissionSettingsDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  rate: number;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  minAmount: number;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  maxAmount: number;
}

/**
 * Admin's own DTO for dispute resolution.
 * Không import từ bookings context — giữ bounded context rõ ràng.
 * TypeScript structural typing đảm bảo compatible với BookingDisputeService.resolveDispute().
 */
export class AdminResolveDisputeDto {
  @IsString()
  resolutionAction: 'COMPLETE' | 'PENALIZE';

  @IsString()
  resolutionReason: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  penaltyAmount?: number;
}
