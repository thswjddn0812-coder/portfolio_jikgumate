import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class UpdateCartItemDto {
  @ApiProperty({ description: '수량', example: 2, minimum: 1 })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;
}
