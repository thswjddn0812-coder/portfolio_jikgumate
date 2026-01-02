import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Carts } from './cart.entity';
import { Products } from '../../products/entities/product.entity';

@Entity('CartItems')
export class CartItems {
  @PrimaryGeneratedColumn({ type: 'int', name: 'cart_item_id' })
  cartItemId: number;

  @Column({ type: 'int', name: 'cart_id' })
  cartId: number;

  @Column({ type: 'int', name: 'product_id' })
  productId: number;

  @Column({ type: 'int', name: 'quantity', default: 1 })
  quantity: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Carts, (cart) => cart.cartItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Carts;

  @ManyToOne(() => Products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Products;
}
