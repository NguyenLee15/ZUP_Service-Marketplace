import {
  IsString,
  IsOptional,
  MaxLength,
  Matches,
  IsBoolean,
  IsNumber,
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
  latitude: number;

  @IsNumber()
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
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class UpdatePushTokenDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  token?: string;
}
