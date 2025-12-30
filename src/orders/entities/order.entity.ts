import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { OrderItems } from '../../order-items/entities/order-item.entity';
import { ShippingInfo } from '../../shipping-info/entities/shipping-info.entity';

@Index('fk_order_user', ['userId'], {})
@Entity('Orders')
export class Orders {
  @PrimaryGeneratedColumn({ type: 'int', name: 'order_id' })
  orderId: number;

  @Column('int', { name: 'user_id' })
  userId: number;

  @Column('decimal', {
    name: 'total_amount',
    nullable: true,
    precision: 12,
    scale: 2,
    default: () => "'0.00'",
  })
  totalAmount: string | null;

  @Column('enum', {
    name: 'status',
    nullable: true,
    enum: [
      'PENDING',
      'PURCHASED',
      'ARRIVED_AT_WAREHOUSE',
      'SHIPPING_START',
      'DELIVERED',
    ],
    default: 'PENDING',
  })
  status:
    | 'PENDING'
    | 'PURCHASED'
    | 'ARRIVED_AT_WAREHOUSE'
    | 'SHIPPING_START'
    | 'DELIVERED'
    | null;

  @Column('timestamp', {
    name: 'order_date',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  orderDate: Date | null;

  @ManyToOne(() => Users, (users) => users.orders, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'user_id' }])
  user: Users;

  @OneToMany(() => OrderItems, (orderItems) => orderItems.order)
  orderItems: OrderItems[];

  @OneToOne(() => ShippingInfo, (shippingInfo) => shippingInfo.order)
  shippingInfo: ShippingInfo;
}
