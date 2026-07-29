import {
  Injectable,
  signal,
} from '@angular/core';

import {
  DriveOsToast,
  ShowDriveOsToast,
} from './driveos-toast.model';

const DEFAULT_DURATION = 5_000;

@Injectable({
  providedIn: 'root',
})
export class DriveOsToastService {
  private readonly toastsSignal =
    signal<readonly DriveOsToast[]>([]);

  readonly toasts =
    this.toastsSignal.asReadonly();

  show(options: ShowDriveOsToast): string {
    const id = crypto.randomUUID();

    const toast: DriveOsToast = {
      id,
      title: options.title,
      message: options.message,
      variant: options.variant ?? 'info',
      duration:
        options.duration ?? DEFAULT_DURATION,
    };

    this.toastsSignal.update(
      current => [...current, toast],
    );

    if (toast.duration > 0) {
      window.setTimeout(
        () => this.dismiss(id),
        toast.duration,
      );
    }

    return id;
  }

  success(
    title: string,
    message?: string,
  ): string {
    return this.show({
      title,
      message,
      variant: 'success',
    });
  }

  error(
    title: string,
    message?: string,
  ): string {
    return this.show({
      title,
      message,
      variant: 'error',
      duration: 8_000,
    });
  }

  warning(
    title: string,
    message?: string,
  ): string {
    return this.show({
      title,
      message,
      variant: 'warning',
    });
  }

  info(
    title: string,
    message?: string,
  ): string {
    return this.show({
      title,
      message,
      variant: 'info',
    });
  }

  dismiss(id: string): void {
    this.toastsSignal.update(
      current =>
        current.filter(
          toast => toast.id !== id,
        ),
    );
  }

  clear(): void {
    this.toastsSignal.set([]);
  }
}
