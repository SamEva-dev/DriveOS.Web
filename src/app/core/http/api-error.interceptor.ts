import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('DriveOS API request failed', {
        url: request.url,
        status: error.status,
        error: error.error,
      });

      return throwError(() => error);
    }),
  );
};
