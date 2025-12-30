import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminGuardGuard } from 'src/common/guard/admin-guard.guard';
import { AuthGuard } from '@nestjs/passport';
@UseGuards(AuthGuard('jwt'), AdminGuardGuard)
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('analyze')
  async analyzeProduct(@Query('url') url: string) {
    return await this.productsService.getProductInfo(url);
  }

  @Post()
  @ApiOperation({
    summary: '상품 생성',
    description: '새로운 상품을 생성합니다.',
  })
  @ApiResponse({ status: 201, description: '상품 생성 성공' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: '상품 목록 조회',
    description: '모든 상품 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '상품 목록 조회 성공' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: '상품 상세 조회',
    description: '특정 상품의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '상품 상세 조회 성공' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '상품 수정',
    description: '특정 상품의 정보를 수정합니다.',
  })
  @ApiResponse({ status: 200, description: '상품 수정 성공' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: '상품 삭제',
    description: '특정 상품을 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '상품 삭제 성공' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
