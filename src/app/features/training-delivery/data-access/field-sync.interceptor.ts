import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { FieldSyncQueueService } from './field-sync-queue.service';

export const fieldSyncInterceptor: HttpInterceptorFn = (request, next) => {
  const queue = inject(FieldSyncQueueService);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const isTrainingWrite = /\/api\/training-delivery\//i.test(request.url) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
      const body = request.body as { operationId?: unknown } | null;
      const isReplayable = typeof body?.operationId === 'string' && body.operationId.length > 0;
      if (isTrainingWrite && isReplayable && error.status === 0) {
        void queue.enqueueRequest({ method: request.method as 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: request.urlWithParams, body: request.body });
        return throwError(() => new HttpErrorResponse({
          status: 0,
          statusText: 'Offline operation queued',
          url: request.urlWithParams,
          error: { code: 'TrainingDelivery.Offline.Queued', messageKey: 'training.sync.queuedOffline' },
        }));
      }
      return throwError(() => error);
    }),
  );
};
