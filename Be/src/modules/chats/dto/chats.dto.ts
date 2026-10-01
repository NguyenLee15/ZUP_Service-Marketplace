import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateConversationDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  serviceId?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  bookingId?: number;
}

export class ChatHistoryQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  cursor?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GetConversationsQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number;
}
