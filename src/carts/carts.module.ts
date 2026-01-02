import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { Carts } from './entities/cart.entity';
import { CartItems } from './entities/cart-item.entity';
import { Products } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Carts, CartItems, Products])],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
