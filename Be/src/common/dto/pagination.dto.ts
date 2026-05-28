import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
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
}

export function paginationMeta(total: number, page = 1, limit = 20) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
