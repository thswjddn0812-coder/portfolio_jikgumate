import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '사용자 이메일', example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '사용자 비밀번호', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '전화번호',
    example: '010-1234-5678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: '기본 배송지 주소',
    example: '서울시 강남구',
    required: false,
  })
  @IsString()
  @IsOptional()
  defaultAddress?: string;

  @ApiProperty({
    description: '개인통관고유부호',
    example: 'P123456789012',
    required: false,
  })
  @IsString()
  @IsOptional()
  pcccNumber?: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  profileImageUrl?: string;
}
