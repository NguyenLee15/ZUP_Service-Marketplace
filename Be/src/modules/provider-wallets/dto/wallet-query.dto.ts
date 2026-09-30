import { Transform, Type } from 'class-transformer';
import { WalletRequestStatus } from '@prisma/client';
import {
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class WalletHistoryQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  type?: string;
}

export class AdminWalletRequestQueryDto extends PaginationQueryDto {
  @IsIn(['all', ...Object.values(WalletRequestStatus)])
  @IsOptional()
  status?: WalletRequestStatus | 'all';
}

export class DepositRequestDto {
  @IsInt()
  @Type(() => Number)
  @Min(10000)
  amount: number;
}

export class ManualDepositRequestDto extends DepositRequestDto {
  @IsString()
  @IsOptional()
  transferCode?: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @IsOptional()
  receiptUrl?: string;
}

export class CreateWithdrawalRequestDto {
  @IsInt()
  @Type(() => Number)
  @Min(50000)
  amount: number;

  @IsString()
  bankName: string;

  @IsString()
  bankAccountNumber: string;

  @IsString()
  bankAccountHolder: string;
}

export class AdminWalletActionDto {
  @IsString()
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @MaxLength(500)
  note?: string;
}
