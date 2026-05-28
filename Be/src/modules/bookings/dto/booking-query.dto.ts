import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class BookingListQueryDto extends PaginationQueryDto {
  @IsString()
  @IsOptional()
  status?: string;
}
