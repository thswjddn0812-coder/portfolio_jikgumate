import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { normalizeHttpException } from './normalize';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(err: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const isHttp = err instanceof HttpException;
    const statusCode = isHttp
      ? err.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const { message, errors } = isHttp
      ? normalizeHttpException(err)
      : {
          message: (err as any)?.message || String(err) || '서버 내부 오류',
          errors: undefined,
        };

    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      ...(errors ? { errors } : {}),
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
