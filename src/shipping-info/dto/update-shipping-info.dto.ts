import { PartialType } from '@nestjs/mapped-types';
import { CreateShippingInfoDto } from './create-shipping-info.dto';

export class UpdateShippingInfoDto extends PartialType(CreateShippingInfoDto) {}
