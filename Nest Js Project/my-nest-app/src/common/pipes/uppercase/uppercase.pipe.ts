/* eslint-disable @typescript-eslint/no-unused-vars */
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class UppercasePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  }
}
