import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Users> {
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<Users | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async update(email: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    await this.usersRepository.update({ email }, updateUserDto);
    return this.findOneByEmail(email);
  }

  async findOne(userId: number): Promise<Users | null> {
    return await this.usersRepository.findOne({ where: { userId } });
  }

  async updateHashedRefreshToken(
    userId: number,
    hashedRt: string | null,
  ): Promise<void> {
    await this.usersRepository.update(userId, { hashedRt });
  }

  async uploadProfileImage(userId: number, file: Express.Multer.File) {
    const fileName = `${userId}_${Date.now()}_${file.originalname}`;
    const { supabase } = require('../../../supabase');
    const { data, error } = await supabase.storage
      .from('photo')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error('이미지 업로드에 실패했습니다.');
    }
    const { data: publicUrlData } = supabase.storage
      .from('photo')
      .getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;
    await this.usersRepository.update(userId, { profileImageUrl: publicUrl });
    return { profileImageUrl: publicUrl };
  }
}
