import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  effect,
  input,
  output,
} from '@angular/core';

import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  A11yModule,
} from '@angular/cdk/a11y';

import {
  TranslatePipe,
} from '@ngx-translate/core';

import {
  DriveOsButtonComponent,
} from '../../../../../shared/ui';

import {
  BranchLifecycleActionDefinition,
} from '../../domain/branch-lifecycle';

function notBlankValidator(
  control: AbstractControl<string>,
): ValidationErrors | null {
  return control.value.trim().length > 0
    ? null
    : {
        blank: true,
      };
}

@Component({
  selector:
    'driveos-branch-status-dialog',

  standalone: true,

  imports: [
    A11yModule,
    ReactiveFormsModule,
    TranslatePipe,

    DriveOsButtonComponent,
  ],

  templateUrl:
    './branch-status-dialog.component.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class BranchStatusDialogComponent {
  readonly open =
    input(false);

  readonly action =
    input<
      BranchLifecycleActionDefinition | null
    >(null);

  readonly branchName =
    input('');

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
          notBlankValidator,
          Validators.maxLength(500),
        ],
      },
    );

  constructor() {
    effect(() => {
      if (this.open()) {
        this.reasonControl.reset('');
      }
    });
  }

  @HostListener(
    'document:keydown.escape',
  )
  onEscape(): void {
    if (
      this.open() &&
      !this.submitting()
    ) {
      this.close();
    }
  }

  close(): void {
    if (this.submitting()) {
      return;
    }

    this.cancelled.emit();
  }

  submit(): void {
    if (
      this.reasonControl.invalid ||
      this.submitting()
    ) {
      this.reasonControl.markAsTouched();
      return;
    }

    const reason =
      this.reasonControl.value.trim();

    if (!reason) {
      this.reasonControl.setErrors({
        blank: true,
      });

      return;
    }

    this.confirmed.emit(reason);
  }

  onBackdropClick(
    event: MouseEvent,
  ): void {
    if (
      event.target ===
      event.currentTarget
    ) {
      this.close();
    }
  }
}
