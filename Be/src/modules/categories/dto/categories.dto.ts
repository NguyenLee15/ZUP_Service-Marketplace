import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;
}
