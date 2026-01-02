import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateCartItemDto {
  @ApiProperty({ description: '상품 ID', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty({ description: '수량', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;
}
