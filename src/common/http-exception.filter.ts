import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

// Every error response has the same shape:
//   { "statusCode": 409, "message": "...", "path": "/films/...", "timestamp": "..." }
// "message" is a string, or an array of strings for validation errors
// (one entry per broken rule).
export interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
}

// @Catch() with no arguments = catch EVERYTHING, not only HttpException.
// That way an unexpected error (e.g. the database is down) also gets this
// shape, and its internal text (SQL, table names) is logged on the server
// but never sent to the client.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      // Nest gives either a plain string or an object like
      // { message: [...], error: 'Bad Request', statusCode: 400 }.
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object' && 'message' in body) {
        message = (body as { message: string | string[] }).message;
      } else {
        message = exception.message;
      }
    } else {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorBody: ErrorResponseBody = {
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(errorBody);
  }
}
