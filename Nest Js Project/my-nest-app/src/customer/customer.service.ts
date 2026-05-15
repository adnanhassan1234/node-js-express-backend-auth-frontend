import { Injectable } from '@nestjs/common';
import { Customer } from './interfaces/customer.interface';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomerService {
  private customers: Customer[] = [];

  getAllCustomers(): Customer[] {
    return this.customers;
  }
  // add cuastomer
  addCustomer(customer: CreateCustomerDto) {
    const newCustomer: Customer = {
      id: Date.now(),
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    };
    this.customers.push(newCustomer);
    return {
      message: `Customer with id ${newCustomer.id} created`,
      customer: newCustomer,
      status: 'success',
    };
  }
}
