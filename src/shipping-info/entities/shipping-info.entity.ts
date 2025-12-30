import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Orders } from '../../orders/entities/order.entity';

@Index('order_id', ['orderId'], { unique: true })
@Entity('Shipping_Info')
export class ShippingInfo {
  @PrimaryGeneratedColumn({ type: 'int', name: 'shipping_id' })
  shippingId: number;

  @Column('int', { name: 'order_id', unique: true })
  orderId: number;

  @Column('varchar', { name: 'tracking_number', nullable: true, length: 100 })
  trackingNumber: string | null;

  @Column('varchar', { name: 'shipping_company', nullable: true, length: 50 })
  shippingCompany: string | null;

  @Column('varchar', { name: 'recipient_name', length: 50 })
  recipientName: string;

  @Column('varchar', { name: 'recipient_address', length: 255 })
  recipientAddress: string;

  @Column('varchar', { name: 'recipient_phone', length: 20 })
  recipientPhone: string;

  @OneToOne(() => Orders, (orders) => orders.shippingInfo, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn([{ name: 'order_id' }])
  order: Orders;
}
