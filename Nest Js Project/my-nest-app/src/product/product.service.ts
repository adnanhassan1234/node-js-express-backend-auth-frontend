import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProductService {
  private products = [
    {
      id: 1,
      name: 'Product 1',
      price: 100,
    },
    {
      id: 2,
      name: 'Product 2',
      price: 200,
    },
  ];
  getAllProucts() {
    return this.products;
  }

  // get single product
  getSingleProduct(id: number) {
    const product = this.products.find((product) => product.id === id);
    if (!product) throw new NotFoundException(`Product not found with id ${id}`);
    return product;
  }
  //   Post method
  createProduct(product: { name: string; price: number }) {
    const newProduct = {
      id: Date.now(),
      name: product.name,
      price: product.price,
    };
    this.products.push(newProduct);
    return {
      message: `Product with id ${newProduct.id} created`,
      product: newProduct,
      status: 'success',
    };
  }
  // put method
  updateProduct(id: number, product: { name: string; price: number }) {
    const existingProduct = this.products.find((product) => product.id === id);
    if (!existingProduct) throw new NotFoundException(`Product not found with id ${id}`);
    existingProduct.name = product.name;
    existingProduct.price = product.price;
    return existingProduct;
  }
  // delete method
  removeProduct(id: number) {
    const index = this.products.findIndex((product) => product.id === id);
    if (index === -1) throw new NotFoundException(`Product not found with id ${id}`);
    const deletedProduct = this.products.splice(index, 1);
    return {
      message: `Product with id ${deletedProduct[0].id} removed`,
      product: deletedProduct[0],
      status: 'success',
    };
  }
}
