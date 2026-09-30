import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class SendMessageWsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  conversationId!: number;

  @IsString()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsIn(['TEXT', 'IMAGE'])
  messageType?: 'TEXT' | 'IMAGE';

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  clientId?: string;
}
