import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class WalletHistoryQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  type?: string;
}

export class AdminWalletRequestQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  status?: string;
}
