import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateLocationDto {
  @IsInt()
  bookingId: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(360)
  heading?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  speed?: number;
}

export class SubscribeTrackingDto {
  @IsInt()
  bookingId: number;
}
