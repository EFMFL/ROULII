import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<{
      method: string;
      originalUrl: string;
      ip: string;
      headers: Record<string, string | undefined>;
      requestId?: string;
    }>();
    const response = http.getResponse<{
      statusCode: number;
      setHeader: (key: string, value: string) => void;
    }>();

    const startedAt = Date.now();
    const requestId =
      request.headers['x-request-id'] || request.requestId || randomUUID();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap(() => {
        const payload = {
          event: 'http_request',
          requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
          ip: request.ip,
        };

        this.logger.log(JSON.stringify(payload));
      }),
    );
  }
}
