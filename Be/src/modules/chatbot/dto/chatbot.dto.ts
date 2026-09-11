import { Type } from 'class-transformer';
import {
  IsArray,
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
  content: string;
}

export class ChatbotAskDto {
  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsArray()
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
  sessionId?: string;

  @IsOptional()
  @IsString()
  userMessage?: string;

  @IsOptional()
  @IsString()
  assistantMessage?: string;

  @IsOptional()
  @IsArray()
  services?: any[];

  @IsOptional()
  @IsArray()
  quickReplies?: any[];

  @IsOptional()
  @IsObject()
  action?: any;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsArray()
  citations?: any[];
}

