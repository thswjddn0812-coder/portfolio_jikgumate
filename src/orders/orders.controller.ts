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
import { AdminGuardGuard } from 'src/common/guard/admin-guard.guard';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(AdminGuardGuard)
  @Post()
  @ApiOperation({
    summary: '주문 생성',
    description: '새로운 주문을 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '주문 생성 성공' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @ApiOperation({
    summary: '주문 목록 조회',
    description: '모든 주문 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '주문 목록 조회 성공' })
  findAll() {
    return this.ordersService.findAll();
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
