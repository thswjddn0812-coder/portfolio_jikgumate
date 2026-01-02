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
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('analyze')
  @ApiOperation({
    summary: '상품 분석 및 저장',
    description:
      'URL을 입력받아 상품 정보를 크롤링하고, DB에 저장한 뒤 정보를 반환합니다. 이미 존재하는 상품이면 DB 정보를 반환합니다. (Body 또는 Query 파라미터로 url 전달 가능)',
  })
  @ApiResponse({
    status: 201,
    description: '상품 분석 및 저장 성공 (productId 포함)',
  })
  async analyzeProduct(
    @Body('url') bodyUrl: string,
    @Query('url') queryUrl: string,
  ) {
    const url = bodyUrl || queryUrl;
    return await this.productsService.analyzeAndCreate(url);
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

  @Get('all')
  @ApiOperation({
    summary: '상품 간략 목록 조회',
    description: '상품의 이미지, 가격, 한글명만 간략하게 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '상품 간략 목록 조회 성공',
    schema: {
      example: [
        {
          productId: 1,
          imageUrl: 'https://example.com/image.jpg',
          price: 10000,
          ko_name: '상품명',
        },
      ],
    },
  })
  findAllSimple() {
    return this.productsService.findAllSimple();
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
