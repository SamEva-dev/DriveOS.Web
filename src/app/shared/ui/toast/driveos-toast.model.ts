export type DriveOsToastVariant =
  | 'success'
  | 'info'
  | 'warning'
  | 'error';

export interface DriveOsToast {
  readonly id: string;
  readonly title: string;
  readonly message?: string;
  readonly variant: DriveOsToastVariant;
  readonly duration: number;
}

export interface ShowDriveOsToast {
  readonly title: string;
  readonly message?: string;
  readonly variant?: DriveOsToastVariant;
  readonly duration?: number;
}
