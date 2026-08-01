import { Injectable, inject } from '@angular/core';

import { HttpErrorResponse } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';

import { ApiError, ApiValidationErrorResponse } from './api-error.model';

@Injectable({
  providedIn: 'root',
})
export class ApiErrorService {
  private readonly translate = inject(TranslateService);

  getMessages(response: HttpErrorResponse): string[] {
    if (response.status === 0) {
      return [this.translate.instant('errors.network')];
    }

    const validationResponse = response.error as ApiValidationErrorResponse | undefined;

    if (validationResponse?.type === 'validation' && Array.isArray(validationResponse.errors)) {
      return validationResponse.errors.map((error) => this.translateError(error));
    }

    const apiError = response.error as ApiError | undefined;

    if (apiError?.messageKey) {
      return [this.translateError(apiError)];
    }

    return [this.translate.instant('errors.generic')];
  }

  private translateError(error: ApiError): string {
    return this.translate.instant(error.messageKey, error.parameters ?? {});
  }
}
