import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsEnum(['PENDING', 'SHIPPING', 'DELIVERED'])
  @ApiProperty({
    description: '주문 상태',
    example: 'SHIPPING',
    enum: ['PENDING', 'SHIPPING', 'DELIVERED'],
    required: false,
  })
  status?: 'PENDING' | 'SHIPPING' | 'DELIVERED';
}
