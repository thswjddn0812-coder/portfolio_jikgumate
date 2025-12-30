import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokens } from './entities/refresh-token.entity';

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshTokens)
    private refreshTokensRepository: Repository<RefreshTokens>,
  ) {}

  async create(userId: number, tokenValue: string): Promise<RefreshTokens> {
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7); // 7 days expiration

    const refreshToken = this.refreshTokensRepository.create({
      userId,
      tokenValue,
      expiresAt: expiredAt,
    });

    return await this.refreshTokensRepository.save(refreshToken);
  }

  async findOneByToken(tokenValue: string): Promise<RefreshTokens | null> {
    return await this.refreshTokensRepository.findOne({
      where: { tokenValue },
    });
  }

  async removeByUserId(userId: number): Promise<void> {
    await this.refreshTokensRepository.delete({ userId });
  }
}
