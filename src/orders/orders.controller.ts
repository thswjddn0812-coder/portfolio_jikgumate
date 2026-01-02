import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Req } from '@nestjs/common';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: '주문 생성 (통합)',
    description:
      '상품 목록과 배송 정보를 입력받아 주문을 생성합니다. 주문(Order), 주문상품(OrderItem), 배송정보(ShippingInfo)가 한 번에 트랜잭션으로 저장됩니다.',
  })
  @ApiResponse({ status: 201, description: '주문 생성 성공 (배송 정보 포함)' })
  create(@Req() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, createOrderDto);
  }

  @Get()
  @ApiOperation({
    summary: '주문 목록 조회',
    description: '모든 주문 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '주문 목록 조회 성공' })
  findAll(@Req() req: any) {
    return this.ordersService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: '주문 상세 조회',
    description: '특정 주문의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '주문 상세 조회 성공' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '주문 수정',
    description: '특정 주문의 정보를 수정합니다.',
  })
  @ApiResponse({ status: 200, description: '주문 수정 성공' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '주문 삭제',
    description: '특정 주문을 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '주문 삭제 성공' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(+id);
  }
}
