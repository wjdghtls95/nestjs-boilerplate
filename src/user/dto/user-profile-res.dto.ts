import { Plan } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '@libs/common/dto/base-response.dto';

export class UserProfileResponseDto extends BaseResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: Plan }) plan: Plan;
  @ApiProperty() timezone: string;
  @ApiProperty() locale: string;
}
