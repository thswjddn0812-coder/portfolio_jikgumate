import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: '회원가입',
    description: '새로운 사용자를 등록합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: CreateUserDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('login')
  @ApiOperation({
    summary: '로그인',
    description:
      '이메일과 비밀번호로 로그인합니다. HttpOnly 쿠키에 Refresh Token을 발급합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: { example: { accessToken: 'eyJ...' } },
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 참고: 실제 앱에서는 LocalGuard를 사용하여 자격 증명을 검증하고 req.user를 채워야 합니다.
    // 여기서는 간단하게 수동 검증을 구현했습니다.
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      res.status(HttpStatus.UNAUTHORIZED).send('Invalid credentials');
      return;
    }

    const tokens = await this.authService.login(user);

    res.cookie('Refresh', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      // secure: true, // 프로덕션 환경(HTTPS)에서 활성화 필요
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: '로그아웃',
    description: '로그아웃을 수행하고 Refresh Token 쿠키를 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const user = req.user;
    await this.authService.logout(user.sub);
    res.clearCookie('Refresh');
    return true;
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({
    summary: '토큰 갱신',
    description:
      'Refresh Token을 사용하여 새로운 Access Token과 Refresh Token을 발급합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    schema: { example: { accessToken: 'eyJ...' } },
  })
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const user = req.user;
    // 'refreshToken' is attached to req.user by JwtRefreshStrategy check
    const tokens = await this.authService.refresh(user.sub, user.refreshToken);

    res.cookie('Refresh', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }
}
