import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  HostListener,
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

import { A11yModule } from '@angular/cdk/a11y';

import { TranslatePipe } from '@ngx-translate/core';
import { DriveOsButtonComponent } from '../../../../shared/ui';
import { OrganizationStatusAction } from '../../models/organization-status-action';

function notBlankValidator(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim().length > 0
    ? null
    : {
        blank: true,
      };
}

@Component({
  selector: 'driveos-organization-status-dialog',
  standalone: true,
  imports: [A11yModule, ReactiveFormsModule, TranslatePipe, DriveOsButtonComponent],
  templateUrl: './organization-status-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationStatusDialogComponent {
  readonly open = input(false);

  readonly action = input<OrganizationStatusAction | null>(null);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  readonly organizationName = input.required<string>();

  readonly submitting = input(false);

  readonly cancelled = output<void>();

  readonly confirmed = output<string>();

  readonly reasonControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, notBlankValidator, Validators.maxLength(500)],
  });

  readonly reasonLength = computed(() => this.reasonControl.value.length);

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

    if (this.reasonControl.invalid || this.submitting()) {
      return;
    }

    const reason = this.reasonControl.value.trim();

    if (!reason) {
      this.reasonControl.setErrors({
        required: true,
      });

      return;
    }

    this.confirmed.emit(reason);
  }
}
