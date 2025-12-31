import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Orders } from './entities/order.entity';
import { Repository, DataSource } from 'typeorm';
import { OrderItems } from '../order-items/entities/order-item.entity';
import { Products } from '../products/entities/product.entity';
import { ShippingInfo } from '../shipping-info/entities/shipping-info.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Orders)
    private ordersRepository: Repository<Orders>,
    @InjectRepository(OrderItems)
    private orderItemsRepository: Repository<OrderItems>,
    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
    @InjectRepository(ShippingInfo)
    private shippingInfoRepository: Repository<ShippingInfo>,
    private dataSource: DataSource,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItemsToSave: Partial<OrderItems>[] = [];

      // 1. Calculate Total & Prepare Items
      for (const item of createOrderDto.items) {
        const product = await this.productsRepository.findOne({
          where: { productId: item.productId },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${item.productId} not found`,
          );
        }

        const price = parseFloat(product.priceUsd);
        totalAmount += price * item.quantity;

        orderItemsToSave.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }

      // 2. Create Order
      const newOrder = queryRunner.manager.create(Orders, {
        userId,
        totalAmount: totalAmount.toFixed(2),
        status: 'PENDING',
      });
      const savedOrder = await queryRunner.manager.save(Orders, newOrder);

      // 3. Create OrderItems
      for (const item of orderItemsToSave) {
        await queryRunner.manager.save(OrderItems, {
          ...item,
          orderId: savedOrder.orderId,
        });
      }

      // 4. Create ShippingInfo (Unified)
      const { shippingInfo } = createOrderDto;
      const newShippingInfo = queryRunner.manager.create(ShippingInfo, {
        orderId: savedOrder.orderId,
        ...shippingInfo,
      });
      await queryRunner.manager.save(ShippingInfo, newShippingInfo);

      await queryRunner.commitTransaction();
      return this.findOne(savedOrder.orderId);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId: number) {
    return await this.ordersRepository.find({
      where: { userId },
      relations: ['orderItems', 'orderItems.product', 'shippingInfo'],
      order: { orderDate: 'DESC' },
    });
  }

  async findOne(id: number) {
    const order = await this.ordersRepository.findOne({
      where: { orderId: id },
      relations: ['orderItems', 'orderItems.product', 'shippingInfo'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
