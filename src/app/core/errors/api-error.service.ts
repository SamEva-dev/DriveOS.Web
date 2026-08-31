import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { ApiError, ApiValidationErrorResponse } from './api-error.model';

interface ProblemDetailsLike {
  readonly title?: string;
  readonly detail?: string;
  readonly code?: string;
  readonly message?: string;
  readonly messageKey?: string;
  readonly parameters?: Record<string, unknown> | null;
}

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  private readonly translate = inject(TranslateService);

  getMessages(error: unknown): string[] {
    if (this.isTechnicalFailure(error)) {
      return [this.translate.instant('errors.technicalUnavailable')];
    }

    if (!(error instanceof HttpErrorResponse)) return [this.translate.instant('errors.technicalUnavailable')];

    const response = error;

    const validationResponse = response.error as ApiValidationErrorResponse | undefined;
    if (validationResponse?.type === 'validation' && Array.isArray(validationResponse.errors)) {
      return [...new Set(validationResponse.errors.map((error) => this.translateError(error)))];
    }

    const body = response.error as ProblemDetailsLike | undefined;
    const messageKey = this.resolveMessageKey(body);
    if (messageKey) {
      const messages = [this.translate.instant(messageKey, body?.parameters ?? {})];
      const requirements = body?.parameters?.['requirements'];
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
                'parameters' in requirement && requirement.parameters ? requirement.parameters : {},
              ),
            );
          }
        }
      }
      return [...new Set(messages)];
    }

    const code = body?.code ?? body?.title;
    if (code) {
      const codeKey = `apiErrors.codes.${code}`;
      const translated = this.translate.instant(codeKey, body?.parameters ?? {});
      if (translated !== codeKey) return [translated];
    }

    return [this.translate.instant('errors.generic')];
  }


  private isTechnicalFailure(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0 || error.status >= 500;
    }

    if (error instanceof Error) {
      const message = error.message.trim().toLowerCase();
      return (
        error.name === 'TimeoutError' ||
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('network request failed') ||
        message.includes('load failed') ||
        message.includes('timeout')
      );
    }

    return false;
  }

  private resolveMessageKey(body: ProblemDetailsLike | undefined): string | null {
    const candidates = [body?.messageKey, body?.detail, body?.message];
    return (
      candidates.find((value) => typeof value === 'string' && value.startsWith('errors.')) ?? null
    );
  }

  private translateError(error: ApiError): string {
    return this.translate.instant(error.messageKey, error.parameters ?? {});
  }
}
