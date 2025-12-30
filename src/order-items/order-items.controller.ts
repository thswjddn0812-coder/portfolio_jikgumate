import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('OrderItems')
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Post()
  @ApiOperation({
    summary: '주문 상품 생성',
    description: '새로운 주문 상품을 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '주문 상품 생성 성공' })
  create(@Body() createOrderItemDto: CreateOrderItemDto) {
    return this.orderItemsService.create(createOrderItemDto);
  }

  @Get()
  @ApiOperation({
    summary: '주문 상품 목록 조회',
    description: '모든 주문 상품 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '주문 상품 목록 조회 성공' })
  findAll() {
    return this.orderItemsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: '주문 상품 상세 조회',
    description: '특정 주문 상품의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '주문 상품 상세 조회 성공' })
  findOne(@Param('id') id: string) {
    return this.orderItemsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '주문 상품 수정',
    description: '특정 주문 상품의 정보를 수정합니다.',
  })
  @ApiResponse({ status: 200, description: '주문 상품 수정 성공' })
  update(
    @Param('id') id: string,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
  ) {
    return this.orderItemsService.update(+id, updateOrderItemDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '주문 상품 삭제',
    description: '특정 주문 상품을 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '주문 상품 삭제 성공' })
  remove(@Param('id') id: string) {
    return this.orderItemsService.remove(+id);
  }
}
