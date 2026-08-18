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
      const messages = [this.translateError(apiError)];
      const requirements = apiError.parameters?.['requirements'];

      if (Array.isArray(requirements)) {
        for (const requirement of requirements) {
          if (
            requirement &&
            typeof requirement === 'object' &&
            'messageKey' in requirement &&
            typeof requirement.messageKey === 'string'
          ) {
            messages.push(
              this.translate.instant(
                requirement.messageKey,
                'parameters' in requirement && requirement.parameters
                  ? requirement.parameters
                  : {},
              ),
            );
          }
        }
      }

      return [...new Set(messages)];
    }

    return [this.translate.instant('errors.generic')];
  }

  private translateError(error: ApiError): string {
    return this.translate.instant(error.messageKey, error.parameters ?? {});
  }
}
