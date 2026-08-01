import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DriveOsToast, DriveOsToastVariant } from './driveos-toast.model';

import { DriveOsToastService } from './driveos-toast.service';

@Component({
  selector: 'drive-os-toast-container',
  standalone: true,
  templateUrl: './driveos-toast-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsToastContainerComponent {
  readonly toastService = inject(DriveOsToastService);

  containerClasses(variant: DriveOsToastVariant): string {
    const classes: Record<DriveOsToastVariant, string> = {
      success: 'border-emerald-200 dark:border-emerald-900',

      info: 'border-blue-200 dark:border-blue-900',

      warning: 'border-orange-200 dark:border-orange-900',

      error: 'border-red-200 dark:border-red-900',
    };

    return classes[variant];
  }

  iconContainerClasses(variant: DriveOsToastVariant): string {
    const classes: Record<DriveOsToastVariant, string> = {
      success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',

      info: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',

      warning: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',

      error: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    };

    return classes[variant];
  }

  iconClass(variant: DriveOsToastVariant): string {
    const classes: Record<DriveOsToastVariant, string> = {
      success: 'ph-fill ph-check-circle text-xl',

      info: 'ph-fill ph-info text-xl',

      warning: 'ph-fill ph-warning text-xl',

      error: 'ph-fill ph-x-circle text-xl',
    };

    return classes[variant];
  }
}
