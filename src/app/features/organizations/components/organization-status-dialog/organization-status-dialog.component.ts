import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
} from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  A11yModule,
} from '@angular/cdk/a11y';

import {
  TranslatePipe,
} from '@ngx-translate/core';
import { DriveOsButtonComponent } from '../../../../shared/ui';
import { OrganizationStatusAction } from '../../models/organization-status-action';


@Component({
  selector:
    'driveos-organization-status-dialog',
  standalone: true,
  imports: [
    A11yModule,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
  ],
  templateUrl:
    './organization-status-dialog.component.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OrganizationStatusDialogComponent {
  readonly open =
    input(false);

  readonly action =
    input<OrganizationStatusAction | null>(
      null,
    );

  readonly organizationName =
    input.required<string>();

  readonly submitting =
    input(false);

  readonly cancelled =
    output<void>();

  readonly confirmed =
    output<string>();

  readonly reasonControl =
    new FormControl(
      '',
      {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(500),
        ],
      },
    );

  readonly reasonLength =
    computed(() =>
      this.reasonControl.value.length,
    );

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.reasonControl.reset('');
        this.reasonControl.markAsPristine();
        this.reasonControl.markAsUntouched();
      }
    });
  }

  close(): void {
    if (this.submitting()) {
      return;
    }

    this.cancelled.emit();
  }

  submit(): void {
    this.reasonControl.markAsTouched();

    if (
      this.reasonControl.invalid ||
      this.submitting()
    ) {
      return;
    }

    const reason =
      this.reasonControl.value.trim();

    if (!reason) {
      this.reasonControl.setErrors({
        required: true,
      });

      return;
    }

    this.confirmed.emit(reason);
  }
}
