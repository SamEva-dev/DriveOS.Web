import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  //const translate = inject(TranslateService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('DriveOS API request failed', {
        url: request.url,
        status: error.status,
        error: error.error,
      });

      if (error.status === 0 || error.status >= 500) {
        //const userMessage = translate.instant('errors.technicalUnavailable');
        return throwError(
          () =>
            new HttpErrorResponse({
              error: {
                message: "userMessage",
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
