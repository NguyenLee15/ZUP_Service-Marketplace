import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ExtractBookingIntentDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export interface SuggestedServiceItem {
  id: number;
  name: string;
  description: string | null;
  referencePrice: number | null;
  avgRating: number;
  category: {
    id: number;
    name: string;
  };
}

export interface BookingIntentResponseDto {
  isAiExtracted: boolean;
  intent: {
    categoryName: string;
    keywords: string[];
    summary: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedBudgetMin?: number;
    estimatedBudgetMax?: number;
  };
  matchedCategory: {
    id: number;
    name: string;
  } | null;
  suggestedServices: SuggestedServiceItem[];
}
