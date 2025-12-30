import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Orders } from '../../orders/entities/order.entity';
import { Products } from '../../products/entities/product.entity';

@Index('fk_item_order', ['orderId'], {})
@Index('fk_item_product', ['productId'], {})
@Entity('Order_Items')
export class OrderItems {
  @PrimaryGeneratedColumn({ type: 'int', name: 'order_item_id' })
  orderItemId: number;

  @Column('int', { name: 'order_id' })
  orderId: number;

  @Column('int', { name: 'product_id' })
  productId: number;

  @Column('int', { name: 'quantity', default: () => "'1'" })
  quantity: number;

  @Column('varchar', { name: 'option_detail', nullable: true, length: 255 })
  optionDetail: string | null;

  @ManyToOne(() => Orders, (orders) => orders.orderItems, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'order_id' }])
  order: Orders;

  @ManyToOne(() => Products, (products) => products.orderItems, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'product_id' }])
  product: Products;
}
