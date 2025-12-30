import { Injectable } from '@nestjs/common';
import { CreateShippingInfoDto } from './dto/create-shipping-info.dto';
import { UpdateShippingInfoDto } from './dto/update-shipping-info.dto';

@Injectable()
export class ShippingInfoService {
  create(createShippingInfoDto: CreateShippingInfoDto) {
    return 'This action adds a new shippingInfo';
  }

  findAll() {
    return `This action returns all shippingInfo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} shippingInfo`;
  }

  update(id: number, updateShippingInfoDto: UpdateShippingInfoDto) {
    return `This action updates a #${id} shippingInfo`;
  }

  remove(id: number) {
    return `This action removes a #${id} shippingInfo`;
  }
}
