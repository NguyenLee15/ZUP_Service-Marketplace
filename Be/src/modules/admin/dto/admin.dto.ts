import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BookingStatus,
  DisputeStatus,
  KycStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { ADMIN_PERMISSION_VALUES } from '../../../common/constants/admin-permissions';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AdminUsersQueryDto extends PaginationQueryDto {
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

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

/**
 * @deprecated Dùng AdminKycQueryDto hoặc AdminDisputesQueryDto tương ứng với domain
 */
export class AdminStatusListQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  status?: string;
}

export class AdminKycQueryDto extends PaginationQueryDto {
  @IsEnum(KycStatus)
  @IsOptional()
  status?: KycStatus;
}

export class AdminDisputesQueryDto extends PaginationQueryDto {
  @IsEnum(DisputeStatus)
  @IsOptional()
  status?: DisputeStatus;
}

export class AdminBookingsQueryDto extends PaginationQueryDto {
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  keyword?: string;
}

export class AdminDashboardQueryDto {
  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsIn(['day', 'week', 'month'])
  @IsOptional()
  groupBy?: 'day' | 'week' | 'month';

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

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
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class CreateStaffDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(8)
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

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

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
  @Max(100)
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

export class SocialZaloConfigDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  oaId?: string;

  @IsOptional()
  @IsString()
  chatUrl?: string;
}

export class SocialFacebookConfigDto {
  @IsOptional()
  @IsString()
  pageUrl?: string;
}

export class SocialTiktokConfigDto {
  @IsOptional()
  @IsString()
  profileUrl?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}

export class UpdateSocialConfigDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialZaloConfigDto)
  zalo?: SocialZaloConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialFacebookConfigDto)
  facebook?: SocialFacebookConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialTiktokConfigDto)
  tiktok?: SocialTiktokConfigDto;
}

/**
 * Admin's own DTO for dispute resolution.
 * Không import từ bookings context — giữ bounded context rõ ràng.
 * TypeScript structural typing đảm bảo compatible với BookingDisputeService.resolveDispute().
 */
export class AdminResolveDisputeDto {
  @IsString()
  @IsIn(['COMPLETE', 'PENALIZE'])
  resolutionAction: 'COMPLETE' | 'PENALIZE';

  @IsString()
  resolutionReason: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  penaltyAmount?: number;
}
