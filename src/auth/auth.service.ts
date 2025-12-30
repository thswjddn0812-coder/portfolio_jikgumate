import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private refreshTokensService: RefreshTokensService,
    private jwtService: JwtService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    const hash = await bcrypt.hash(createUserDto.password, 10);
    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hash,
    });
    const tokens = await this.getTokens(
      newUser.userId,
      newUser.email,
      newUser.isAdmin ?? false,
    );
    await this.updateRefreshTokens(newUser.userId, tokens.refreshToken);
    return tokens;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const tokens = await this.getTokens(user.userId, user.email, user.isAdmin);
    await this.updateRefreshTokens(user.userId, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    await this.usersService.updateHashedRefreshToken(userId, null);
    await this.refreshTokensService.removeByUserId(userId);
  }

  async refresh(userId: number, rt: string) {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.hashedRt) throw new ForbiddenException('Access Denied');

    const rtMatches = await bcrypt.compare(rt, user.hashedRt);
    if (!rtMatches) throw new ForbiddenException('Access Denied');

    const rtStored = await this.refreshTokensService.findOneByToken(rt);
    if (!rtStored)
      throw new ForbiddenException('Access Denied: Token not found in DB');

    const tokens = await this.getTokens(
      user.userId,
      user.email,
      user.isAdmin ?? false,
    );
    await this.updateRefreshTokens(user.userId, tokens.refreshToken);
    return tokens;
  }

  async updateRefreshTokens(userId: number, rt: string) {
    const hash = await bcrypt.hash(rt, 10);
    await this.usersService.updateHashedRefreshToken(userId, hash);
    await this.refreshTokensService.removeByUserId(userId); // Remove old tokens (optional: keep history?)
    await this.refreshTokensService.create(userId, rt);
  }

  async getTokens(userId: number, email: string, isAdmin: boolean) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, is_admin: isAdmin },
        { secret: 'at-secret', expiresIn: '1m' }, // TODO: Env
      ),
      this.jwtService.signAsync(
        { sub: userId, email, is_admin: isAdmin },
        { secret: 'rt-secret', expiresIn: '3m' }, // TODO: Env
      ),
    ]);

    return {
      accessToken: at,
      refreshToken: rt,
    };
  }
}
