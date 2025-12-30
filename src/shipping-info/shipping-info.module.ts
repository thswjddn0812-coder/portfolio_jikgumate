import { Module } from '@nestjs/common';
import { ShippingInfoService } from './shipping-info.service';
import { ShippingInfoController } from './shipping-info.controller';

@Module({
  controllers: [ShippingInfoController],
  providers: [ShippingInfoService],
})
export class ShippingInfoModule {}
