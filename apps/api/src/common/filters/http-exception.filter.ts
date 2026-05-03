import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseContent =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const body =
      typeof responseContent === 'string'
        ? { statusCode: status, message: responseContent, error: this.statusText(status) }
        : { 
            statusCode: status, 
            message: (responseContent as any)?.message ?? 'An unexpected error occurred',
            error: (responseContent as any)?.error ?? this.statusText(status),
            ...(typeof responseContent === 'object' ? responseContent : {}),
          };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      try {
        this.logger.error(
          `${request.method} ${request.url} → ${status}`,
          exception instanceof Error ? exception.stack : String(exception),
        );
      } catch {
        console.error('Error during exception filtering', exception);
      }
    }

    response.status(status).json({
      ...body,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private statusText(status: number): string {
    return HttpStatus[status] ?? 'Unknown Error';
  }
}
