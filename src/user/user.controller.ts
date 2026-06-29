import { Controller, Delete, Get, HttpStatus, Patch, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CurrentUser } from '@libs/common/decorators/current-user.decorator';
import { ApiResponseSpec } from '@libs/common/decorators/api-response-spec.decorator';
import { DOMAIN_ERRORS } from '@libs/common/constants/errors/domain.errors';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user-req.dto';
import { UserProfileResponseDto } from './dto/user-profile-res.dto';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiResponseSpec({ summary: '내 프로필 조회', auth: true, type: UserProfileResponseDto })
  handleGetMe(@CurrentUser() user: User) {
    return { data: UserProfileResponseDto.fromEntity(user) };
  }

  @Patch('me')
  @ApiResponseSpec({
    summary: '내 프로필 수정',
    auth: true,
    body: { type: UpdateUserDto },
    errors: [DOMAIN_ERRORS.USER_UPDATE_FAILED],
  })
  async handleUpdateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    const updated = await this.userService.updateUser(user.id, dto);
    return { data: UserProfileResponseDto.fromEntity(updated) };
  }

  @Delete('me')
  @ApiResponseSpec({
    summary: '계정 삭제',
    status: HttpStatus.NO_CONTENT,
    auth: true,
    errors: [DOMAIN_ERRORS.USER_NOT_FOUND],
  })
  async handleDeleteMe(@CurrentUser() user: User) {
    await this.userService.deleteUser(user.id);
  }
}
