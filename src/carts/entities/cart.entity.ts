import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { CartItems } from '../entities/cart-item.entity';

@Entity('Carts')
export class Carts {
  @PrimaryGeneratedColumn({ type: 'int', name: 'cart_id' })
  cartId: number;

  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Users)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToMany(() => CartItems, (cartItems) => cartItems.cart)
  cartItems: CartItems[];
}
