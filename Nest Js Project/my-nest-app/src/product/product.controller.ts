import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  // get all products
  @Get()
  getProducts() {
    return this.productService.getAllProucts();
  }
  //    single product
  @Get(':id')
  getProduct(@Param('id') id: string) {
    return this.productService.getSingleProduct(Number(id));
  }

  // create product
  @Post()
  createProduct(@Body() product: { name: string; price: number }) {
    return this.productService.createProduct(product);
  }

  // put method
  @Put(':id')
  updateProduct(@Param('id') id: string, @Body() product: { name: string; price: number }) {
    return this.productService.updateProduct(Number(id), product);
  }
  // delete method
  @Delete(':id')
  removeProduct(@Param('id') id: string) {
    return this.productService.removeProduct(Number(id));
  }
}
