import { IsOptional, IsString } from 'class-validator';

export class RefreshReqDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
