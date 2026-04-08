import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message = this.extractMessage(exceptionResponse);
    const requestId = request.header('x-request-id') ?? randomUUID();

    const logPayload = {
      level: status >= 500 ? 'error' : 'warn',
      requestId,
      method: request.method,
      path: request.originalUrl,
      status,
      message,
    };

    const serialized = JSON.stringify(logPayload);

    if (status >= 500) {
      this.logger.error(serialized);
      this.logger.error(
        JSON.stringify({
          event: 'alert',
          severity: 'high',
          requestId,
          status,
          path: request.originalUrl,
        }),
      );
    } else {
      this.logger.warn(serialized);
    }

    response.setHeader('x-request-id', requestId);
    response.status(status).json({
      statusCode: status,
      message,
      requestId,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }

  private extractMessage(exceptionResponse: unknown): string | string[] {
    if (!exceptionResponse) {
      return 'Internal server error';
    }

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      return (exceptionResponse as { message: string | string[] }).message;
    }

    return 'Internal server error';
  }
}
