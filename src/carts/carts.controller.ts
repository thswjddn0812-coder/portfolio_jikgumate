import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Carts')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @ApiOperation({
    summary: '내 장바구니 조회',
    description: '현재 로그인한 유저의 장바구니 목록을 조회합니다.',
  })
  getCart(@Req() req: any) {
    return this.cartsService.getCart(req.user.userId);
  }

  @Post('items')
  @ApiOperation({
    summary: '장바구니 담기',
    description:
      '상품을 장바구니에 추가합니다. 이미 있으면 수량을 증가시킵니다.',
  })
  addToCart(@Req() req: any, @Body() createCartItemDto: CreateCartItemDto) {
    return this.cartsService.addToCart(req.user.userId, createCartItemDto);
  }

  @Patch('items/:cartItemId')
  @ApiOperation({
    summary: '장바구니 아이템 수정',
    description: '장바구니에 담긴 상품의 수량을 수정합니다.',
  })
  updateCartItem(
    @Req() req: any,
    @Param('cartItemId') cartItemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateCartItem(
      req.user.userId,
      +cartItemId,
      updateCartItemDto,
    );
  }

  @Delete('items/:cartItemId')
  @ApiOperation({
    summary: '장바구니 아이템 삭제',
    description: '장바구니에서 특정 상품을 제거합니다.',
  })
  removeCartItem(@Req() req: any, @Param('cartItemId') cartItemId: string) {
    return this.cartsService.removeCartItem(req.user.userId, +cartItemId);
  }
}
