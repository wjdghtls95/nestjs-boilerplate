import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user-req.dto';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly userRepository: UserRepository) {}

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    return this.userRepository.update(id, dto);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.softDelete(id);

    this.logger.log(`user ${id} soft-deleted`);
  }
}
