import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItems } from './entities/cart-item.entity';
import { Carts } from './entities/cart.entity';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Products } from '../products/entities/product.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Carts)
    private cartsRepository: Repository<Carts>,
    @InjectRepository(CartItems)
    private cartItemsRepository: Repository<CartItems>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
  ) {}

  async getCart(userId: number) {
    let cart = await this.cartsRepository.findOne({
      where: { userId },
      relations: ['cartItems', 'cartItems.product'],
    });

    if (!cart) {
      cart = this.cartsRepository.create({ userId });
      await this.cartsRepository.save(cart);
      cart.cartItems = [];
    }

    return cart;
  }

  async addToCart(userId: number, createCartItemDto: CreateCartItemDto) {
    const { productId, quantity } = createCartItemDto;

    // 상품 존재 확인
    const product = await this.productsRepository.findOne({
      where: { productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 장바구니 가져오기 (없으면 생성)
    let cart = await this.cartsRepository.findOne({
      where: { userId },
      relations: ['cartItems'],
    });

    if (!cart) {
      cart = this.cartsRepository.create({ userId });
      await this.cartsRepository.save(cart);
    }

    // 이미 장바구니에 있는 상품인지 확인
    let cartItem = await this.cartItemsRepository.findOne({
      where: { cartId: cart.cartId, productId },
    });

    if (cartItem) {
      // 수량 업데이트
      cartItem.quantity += quantity;
      await this.cartItemsRepository.save(cartItem);
    } else {
      // 새 항목 추가
      cartItem = this.cartItemsRepository.create({
        cartId: cart.cartId,
        productId,
        quantity,
      });
      await this.cartItemsRepository.save(cartItem);
    }

    return this.getCart(userId);
  }

  async updateCartItem(
    userId: number,
    cartItemId: number,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.getCart(userId);
    const cartItem = await this.cartItemsRepository.findOne({
      where: { cartItemId, cartId: cart.cartId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemsRepository.update(cartItemId, updateCartItemDto);

    return this.getCart(userId);
  }

  async removeCartItem(userId: number, cartItemId: number) {
    const cart = await this.getCart(userId);
    const cartItem = await this.cartItemsRepository.findOne({
      where: { cartItemId, cartId: cart.cartId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemsRepository.remove(cartItem);

    return this.getCart(userId);
  }
}
