import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class RevokeMessageWsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId!: number;
}
