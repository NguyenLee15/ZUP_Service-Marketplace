import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

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
}
