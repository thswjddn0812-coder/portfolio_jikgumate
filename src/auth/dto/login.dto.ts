import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '사용자 이메일', example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '사용자 비밀번호', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
