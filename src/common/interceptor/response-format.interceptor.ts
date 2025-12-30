import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'ok',
        data,
        meta: {
          path: context.switchToHttp().getRequest().url,
          timestamp: new Date().toISOString(),
          responseTime: `${Date.now() - now}ms`,
        },
      })),
    );
  }
}
