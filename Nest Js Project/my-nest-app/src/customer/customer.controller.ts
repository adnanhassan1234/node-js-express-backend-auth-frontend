import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { Customer } from './interfaces/customer.interface';
import { AuthGuard } from 'src/guards/auth/auth.guard';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @UseGuards(AuthGuard)
  getAllCustomers(): Customer[] {
    return this.customerService.getAllCustomers();
  }

  @Post()
  addCustomer(@Body() customer: CreateCustomerDto) {
    return this.customerService.addCustomer(customer);
  }
}
