import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from './entities/order.entity';
import { OrderItems } from '../order-items/entities/order-item.entity';
import { Products } from '../products/entities/product.entity';
import { ShippingInfo } from '../shipping-info/entities/shipping-info.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Orders, OrderItems, Products, ShippingInfo]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
