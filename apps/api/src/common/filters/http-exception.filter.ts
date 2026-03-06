import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { randomUUID } from 'crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private getRequestId(req: Request): string {
    return (req as Request & { requestId?: string }).requestId ?? randomUUID();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const requestId = this.getRequestId(req);

    if (exception instanceof ZodError) {
      const message =
        exception.errors?.[0]?.message ?? 'Dados inválidos. Verifique os campos.';
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Bad Request',
        requestId,
      });
      return;
    }

    if (exception && typeof (exception as { getStatus?: () => number }).getStatus === 'function') {
      const ex = exception as { getStatus: () => number; getResponse: () => unknown };
      const status = ex.getStatus();
      const body = ex.getResponse();
      const payload = typeof body === 'object' && body !== null ? { ...(body as object), requestId } : { message: body, requestId };
      res.status(status).json(payload);

      if (status === HttpStatus.UNAUTHORIZED) {
        this.logger.warn(`401 Unauthorized requestId=${requestId} path=${req.method} ${req.path} reason=${(payload as { message?: string }).message ?? 'não autorizado'}`);
      }
      if (status === HttpStatus.FORBIDDEN) {
        this.logger.warn(`403 Forbidden requestId=${requestId} path=${req.method} ${req.path}`);
      }
      return;
    }

    const err = exception as Error;
    const errMessage = err?.message ?? String(exception);
    this.logger.error(`[500] requestId=${requestId} ${req.method} ${req.path} error=${errMessage}`);
    if (err?.stack) {
      this.logger.error(err.stack);
    }
    const isDev = process.env.NODE_ENV === 'development';
    const showError = isDev || process.env.DEBUG_ERROR_MESSAGE === '1';
    const safeMessage = showError ? errMessage.replace(/\b(password|secret|token)=[^\s]+/gi, '$1=***') : 'Erro interno. Tente novamente.';
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: safeMessage,
      error: 'Internal Server Error',
      requestId,
    });
  }
}
