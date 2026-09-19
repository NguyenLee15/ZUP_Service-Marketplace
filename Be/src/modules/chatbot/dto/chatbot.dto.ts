import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMaxSize,
  MaxLength,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ChatbotPageContextDto {
  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  serviceId?: number | string;

  @IsOptional()
  bookingId?: number | string;

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  addressText?: string;
}

export class ChatMessageHistoryItemDto {
  @IsString()
  role: string;

  @IsString()
  @MaxLength(4000)
  content: string;
}

export class ChatbotAskDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageHistoryItemDto)
  history?: ChatMessageHistoryItemDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ChatbotPageContextDto)
  pageContext?: ChatbotPageContextDto;

  @IsOptional()
  @IsString()
  confirmedActionId?: string;
}

export class ChatbotStreamResultDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  userMessage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  assistantMessage?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  services?: any[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  quickReplies?: any[];

  @IsOptional()
  @IsObject()
  action?: any;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  citations?: any[];
}
