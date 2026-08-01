export interface ApiError {
  type: string;
  code: string;
  messageKey: string;
  parameters: Record<string, unknown> | null;
  traceId: string | null;
}

export interface ApiValidationErrorResponse {
  type: 'validation';
  errors: ApiError[];
  traceId: string | null;
}
