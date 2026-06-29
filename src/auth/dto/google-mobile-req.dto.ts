import { IsString } from 'class-validator';

export class GoogleMobileReqDto {
  @IsString()
  code: string;

  @IsString()
  code_verifier: string;
}
