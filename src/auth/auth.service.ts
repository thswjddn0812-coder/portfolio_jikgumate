import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Users } from '../users/entities/user.entity';
import { Carts } from '../carts/entities/cart.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private refreshTokensService: RefreshTokensService,
    private jwtService: JwtService,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Carts)
    private cartsRepository: Repository<Carts>,
    private dataSource: DataSource,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 이메일 중복 체크
      const existingUser = await queryRunner.manager.findOne(Users, {
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }

      // 2. 비밀번호 해싱
      const hash = await bcrypt.hash(createUserDto.password, 10);

      // 3. 사용자 생성
      const newUser = queryRunner.manager.create(Users, {
        ...createUserDto,
        password: hash,
      });
      const savedUser = await queryRunner.manager.save(Users, newUser);

      // 4. 장바구니 생성
      const newCart = queryRunner.manager.create(Carts, {
        userId: savedUser.userId,
      });
      await queryRunner.manager.save(Carts, newCart);

      // 5. 트랜잭션 커밋
      await queryRunner.commitTransaction();

      // 6. 토큰 발급 (트랜잭션 외부에서 처리)
      const tokens = await this.getTokens(
        savedUser.userId,
        savedUser.email,
        savedUser.isAdmin ?? false,
      );
      await this.updateRefreshTokens(savedUser.userId, tokens.refreshToken);

      return tokens;
    } catch (err) {
      // 트랜잭션 롤백
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // QueryRunner 해제
      await queryRunner.release();
    }
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
    await this.refreshTokensService.removeByUserId(userId); // 이전 토큰 제거 (선택사항: 히스토리 보관?)
    await this.refreshTokensService.create(userId, rt);
  }

  async getTokens(userId: number, email: string, isAdmin: boolean) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, is_admin: isAdmin },
        { secret: 'at-secret', expiresIn: '10m' }, // TODO: 환경변수로 변경
      ),
      this.jwtService.signAsync(
        { sub: userId, email, is_admin: isAdmin },
        { secret: 'rt-secret', expiresIn: '1h' }, // TODO: 환경변수로 변경
      ),
    ]);

    return {
      accessToken: at,
      refreshToken: rt,
    };
  }
}
