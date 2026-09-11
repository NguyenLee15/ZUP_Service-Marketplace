import {
  IsString,
  IsOptional,
  MaxLength,
  Matches,
  IsBoolean,
  IsNumber,
  Max,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  fullName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^0\d{9}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;
}

export class CreateAddressDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  label?: string;

  @IsString()
  @MaxLength(50)
  province: string;

  @IsString()
  @MaxLength(50)
  district: string;

  @IsString()
  @MaxLength(50)
  ward: string;

  @IsString()
  addressDetail: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  label?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  province?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  district?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  ward?: string;

  @IsString()
  @IsOptional()
  addressDetail?: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

export class UpdatePushTokenDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  token?: string;
}

export class UpdateOnlineStatusDto {
  @IsBoolean()
  isOnline: boolean;
}
