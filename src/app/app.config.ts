import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';

import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { provideTranslateService } from '@ngx-translate/core';

import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

import { API_CONFIG } from './core/config/api-config';

import { apiErrorInterceptor } from './core/http/api-error.interceptor';

import { correlationIdInterceptor } from './core/http/correlation-id.interceptor';

import { provideTheme } from './core/theme/provide-theme';
import { AUTH_API_CONFIG } from './core/auth/auth-api-config';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { fieldSyncInterceptor } from './features/training-delivery/data-access/field-sync.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideZonelessChangeDetection(),

    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
      }),
    ),

    provideHttpClient(
      withInterceptors([correlationIdInterceptor, authInterceptor, fieldSyncInterceptor, apiErrorInterceptor]),
    ),

    provideTranslateService({
      fallbackLang: 'fr',
      lang: 'fr',
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
    }),

    provideTheme(),

    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: environment.BASE_DRIVEOS_API,
      },
    },
    {
      provide: AUTH_API_CONFIG,

      useValue: {
        baseUrl: environment.BASE_AUTH_API,
        clientId: environment.AUTH_CLIENT_ID,
      },
    },
  ],
};
