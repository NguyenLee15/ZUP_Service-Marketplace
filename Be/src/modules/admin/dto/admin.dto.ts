import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Admin's own DTO for dispute resolution.
 * Không import từ bookings context — giữ bounded context rõ ràng.
 * TypeScript structural typing đảm bảo compatible với BookingsService.resolveDispute().
 */
export class AdminResolveDisputeDto {
  @IsString()
  resolutionAction: 'COMPLETE' | 'PENALIZE';

  @IsString()
  resolutionReason: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  penaltyAmount?: number;
}
