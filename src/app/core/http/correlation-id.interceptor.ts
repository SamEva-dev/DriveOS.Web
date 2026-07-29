import {
  HttpInterceptorFn,
} from '@angular/common/http';

function createCorrelationId(): string {
  return crypto.randomUUID();
}

export const correlationIdInterceptor:
  HttpInterceptorFn = (
    request,
    next,
  ) => {
    const correlationId =
      request.headers.get(
        'X-Correlation-ID',
      ) ?? createCorrelationId();

    const correlatedRequest =
      request.clone({
        setHeaders: {
          'X-Correlation-ID':
            correlationId,
        },
      });

    return next(correlatedRequest);
  };
