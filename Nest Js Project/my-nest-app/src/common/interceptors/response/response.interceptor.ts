/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse();

    return next.handle().pipe(
      map((response) => {
        const statusCode = res.statusCode;

        if (response && response.message && response.data !== undefined) {
          return {
            success: true,
            statusCode,
            message: response.message,
            data: response.data,
          };
        }

        if (response && response.results && response.total_records !== undefined) {
          return {
            success: true,
            statusCode,
            message: 'Request successful',
            data: response,
          };
        }

        return {
          success: true,
          statusCode,
          message: 'Request successful',
          data: response,
        };
      }),
    );
  }
}
