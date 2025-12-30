import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderItems } from '../../order-items/entities/order-item.entity';

@Entity('Products')
export class Products {
  @PrimaryGeneratedColumn({ type: 'int', name: 'product_id' })
  productId: number;

  @Column('text', { name: 'original_url', nullable: true })
  originalUrl: string | null;

  @Column('varchar', { name: 'name_ko', length: 255 })
  nameKo: string;

  @Column('varchar', { name: 'name_en', nullable: true, length: 255 })
  nameEn: string | null;

  @Column('varchar', { name: 'category', nullable: true, length: 50 })
  category: string | null;

  @Column('decimal', { name: 'price_usd', precision: 10, scale: 2 })
  priceUsd: string;

  @Column('text', { name: 'image_url', nullable: true })
  imageUrl: string | null;

  @Column('timestamp', {
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @OneToMany(() => OrderItems, (orderItems) => orderItems.product)
  orderItems: OrderItems[];
}
