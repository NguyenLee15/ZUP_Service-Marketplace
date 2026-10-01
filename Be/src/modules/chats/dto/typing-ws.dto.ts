import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class TypingWsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  conversationId!: number;
}
