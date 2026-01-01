import { Type } from 'class-transformer';
import {
  IsNumber,
  ValidateNested,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemSubDto {
  @ApiProperty({ description: '상품 ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: '수량', example: 2 })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class ShippingDetailsDto {
  @ApiProperty({ description: '수령인 이름', example: '홍길동' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ description: '수령인 주소', example: '서울시 강남구' })
  @IsString()
  @IsNotEmpty()
  recipientAddress: string;

  @ApiProperty({ description: '수령인 전화번호', example: '010-1234-5678' })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({
    description: '배송사 (선택사항)',
    example: 'CJ대한통운',
    required: false,
  })
  @IsString()
  @IsOptional()
  shippingCompany?: string;

  @ApiProperty({
    description: '운송장 번호 (선택사항)',
    example: '',
    required: false,
  })
  @IsString()
  @IsOptional()
  trackingNumber?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemSubDto], description: '주문 상품 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemSubDto)
  items: CreateOrderItemSubDto[];

  @ApiProperty({ type: ShippingDetailsDto, description: '배송 정보' })
  @ValidateNested()
  @Type(() => ShippingDetailsDto)
  @IsNotEmpty()
  shippingInfo: ShippingDetailsDto;
}
