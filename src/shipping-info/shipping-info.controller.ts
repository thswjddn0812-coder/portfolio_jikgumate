import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ShippingInfoService } from './shipping-info.service';
import { CreateShippingInfoDto } from './dto/create-shipping-info.dto';
import { UpdateShippingInfoDto } from './dto/update-shipping-info.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminGuardGuard } from 'src/common/guard/admin-guard.guard';
import { AuthGuard } from '@nestjs/passport';
@UseGuards(AuthGuard('jwt'), AdminGuardGuard)
@ApiTags('ShippingInfo')
@Controller('shipping-info')
export class ShippingInfoController {
  constructor(private readonly shippingInfoService: ShippingInfoService) {}

  @Post()
  @ApiOperation({
    summary: '배송 정보 생성',
    description: '새로운 배송 정보를 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '배송 정보 생성 성공' })
  create(@Body() createShippingInfoDto: CreateShippingInfoDto) {
    return this.shippingInfoService.create(createShippingInfoDto);
  }

  @Get()
  @ApiOperation({
    summary: '배송 정보 목록 조회',
    description: '모든 배송 정보 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '배송 정보 목록 조회 성공' })
  findAll() {
    return this.shippingInfoService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: '배송 정보 상세 조회',
    description: '특정 배송 정보의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '배송 정보 상세 조회 성공' })
  findOne(@Param('id') id: string) {
    return this.shippingInfoService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '배송 정보 수정',
    description: '특정 배송 정보의 정보를 수정합니다.',
  })
  @ApiResponse({ status: 200, description: '배송 정보 수정 성공' })
  update(
    @Param('id') id: string,
    @Body() updateShippingInfoDto: UpdateShippingInfoDto,
  ) {
    return this.shippingInfoService.update(+id, updateShippingInfoDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '배송 정보 삭제',
    description: '특정 배송 정보를 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '배송 정보 삭제 성공' })
  remove(@Param('id') id: string) {
    return this.shippingInfoService.remove(+id);
  }
}
