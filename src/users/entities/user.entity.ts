import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Orders } from '../../orders/entities/order.entity';
import { RefreshTokens } from '../../refresh-tokens/entities/refresh-token.entity';

@Index('email', ['email'], { unique: true })
@Entity('Users', { schema: 'JikguMate' })
export class Users {
  @PrimaryGeneratedColumn({ type: 'int', name: 'user_id' })
  userId: number;

  @Column('varchar', { name: 'email', unique: true, length: 100 })
  email: string;

  @Column('tinyint', {
    name: 'is_admin',
    nullable: true,
    comment: '0: 일반유저, 1: 관리자',
    width: 1,
    default: () => "'0'",
  })
  isAdmin: boolean | null;

  @Column('varchar', { name: 'password', length: 255 })
  password: string;

  @Column('varchar', { name: 'name', length: 50 })
  name: string;

  @Column('varchar', { name: 'phone', nullable: true, length: 20 })
  phone: string | null;

  @Column('varchar', {
    name: 'pccc_number',
    nullable: true,
    comment: '개인통관고유부호',
    length: 20,
  })
  pcccNumber: string | null;

  @Column('varchar', { name: 'default_address', nullable: true, length: 255 })
  defaultAddress: string | null;

  @Column('timestamp', {
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @Column('varchar', { name: 'hashed_rt', nullable: true, length: 255 })
  hashedRt: string | null;

  @Column('varchar', { name: 'profile_image_url', nullable: true, length: 500 })
  profileImageUrl: string | null;

  @OneToMany(() => Orders, (orders) => orders.user)
  orders: Orders[];

  @OneToMany(() => RefreshTokens, (refreshTokens) => refreshTokens.user)
  refreshTokens: RefreshTokens[];
}
