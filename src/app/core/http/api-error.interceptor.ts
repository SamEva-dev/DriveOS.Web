import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0 || error.status >= 500) {
        return throwError(
          () =>
            new HttpErrorResponse({
              error: {
                message: 'errors.technicalUnavailable',
                messageKey: 'errors.technicalUnavailable',
              },
              headers: error.headers,
              status: error.status,
              statusText: error.statusText,
              url: error.url ?? request.url,
            }),
        );
      }

      return throwError(() => error);
    }),
  );
};
