import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(0)
  priceInPaise: number;

  @IsEnum(['monthly', 'quarterly', 'yearly'])
  billingCycle: 'monthly' | 'quarterly' | 'yearly';

  @IsInt()
  @Min(1)
  maxStudents: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  smsQuota?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
