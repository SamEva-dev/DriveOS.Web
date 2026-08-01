import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  from,
  switchMap,
  throwError,
} from 'rxjs';

import { API_CONFIG } from '../../config/api-config';
import { AUTH_API_CONFIG } from '../auth-api-config';
import { AuthService } from '../../services/auth.service';

const RETRY_AFTER_REFRESH = 'x-driveos-auth-retry';

export const authInterceptor: HttpInterceptorFn = (
  request,
  next,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authConfig = inject(AUTH_API_CONFIG);
  const apiConfig = inject(API_CONFIG);

  const authBaseUrl = normalizeBaseUrl(
    authConfig.baseUrl,
  );
  const driveOsApiBaseUrl = normalizeBaseUrl(
    apiConfig.baseUrl,
  );

  const isAuthRequest = request.url.startsWith(
    authBaseUrl,
  );
  const isDriveOsApiRequest = request.url.startsWith(
    driveOsApiBaseUrl,
  );

  if (isAuthRequest || !isDriveOsApiRequest) {
    return next(request);
  }

  const requestWithToken = attachAccessToken(
    request,
    auth.accessToken(),
  );

  return next(requestWithToken).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 403) {
        void router.navigate(['/forbidden'], {
          queryParams: {
            returnUrl: router.url,
          },
        });

        return throwError(() => error);
      }

      const alreadyRetried =
        request.headers.has(RETRY_AFTER_REFRESH);

      if (
        error.status !== 401 ||
        alreadyRetried ||
        !auth.hasRefreshToken()
      ) {
        if (error.status === 401) {
          auth.logout();
          void router.navigate(['/login'], {
            queryParams: {
              returnUrl: router.url,
            },
          });
        }

        return throwError(() => error);
      }

      return from(auth.refresh()).pipe(
        switchMap(refreshed => {
          if (!refreshed) {
            auth.logout();
            void router.navigate(['/login'], {
              queryParams: {
                returnUrl: router.url,
              },
            });

            return throwError(() => error);
          }

          const retriedRequest = attachAccessToken(
            request.clone({
              setHeaders: {
                [RETRY_AFTER_REFRESH]: '1',
              },
            }),
            auth.accessToken(),
          );

          return next(retriedRequest);
        }),
      );
    }),
  );
};

function attachAccessToken(
  request: Parameters<HttpInterceptorFn>[0],
  accessToken: string | null,
) {
  if (!accessToken) {
    return request;
  }

  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '');
}
