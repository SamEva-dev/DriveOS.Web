import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  TranslatePipe,
  TranslateService,
} from '@ngx-translate/core';

import {
  DriveOsButtonComponent,
  DriveOsInputDirective,
} from '../../../../../shared/ui';

import {
  BranchFormValue,
} from '../../models/branch-form-value';

import {
  BRANCH_TYPE_OPTIONS,
  BranchType,
} from '../../models/branch-type';

export type BranchFormMode =
  | 'create'
  | 'edit';

@Component({
  selector:
    'driveos-branch-form',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    TranslatePipe,

    DriveOsButtonComponent,
    DriveOsInputDirective,
  ],

  templateUrl:'./branch-form.component.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class BranchFormComponent {
  private readonly formBuilder =
    inject(FormBuilder);

  private readonly translate =
    inject(TranslateService);

  readonly mode =
    input<BranchFormMode>('create');

  readonly initialValue =
    input<BranchFormValue | null>(null);

  readonly submitting =
    input(false);

  readonly submitted =
    output<BranchFormValue>();

  readonly cancelled =
    output<void>();

  readonly isCreateMode =
    computed(
      () => this.mode() === 'create',
    );

  readonly branchTypeOptions =
    computed(() =>
      BRANCH_TYPE_OPTIONS.map(
        option => ({
          value: option.value,
          label:
            this.translate.instant(
              option.labelKey,
            ),
        }),
      ),
    );

  readonly form =
    this.formBuilder.nonNullable.group({
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(150),
        ],
      ],

      code: [
        '',
        [
          Validators.required,
          Validators.maxLength(20),
          Validators.pattern(
            /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
          ),
        ],
      ],

      branchType: [
        null as BranchType | null,
        Validators.required,
      ],

      addressLine1: [
        '',
        [
          Validators.required,
          Validators.maxLength(200),
        ],
      ],

      addressLine2: [
        '',
        [
          Validators.maxLength(200),
        ],
      ],

      postalCode: [
        '',
        [
          Validators.required,
          Validators.maxLength(20),
        ],
      ],

      city: [
        '',
        [
          Validators.required,
          Validators.maxLength(120),
        ],
      ],

      timeZoneId: [
        'Europe/Paris',
        [
          Validators.required,
          Validators.maxLength(100),
        ],
      ],

      isPrimary: [
        false,
      ],
    });

  constructor() {
  effect(() => {
    const mode =
      this.mode();

    const initialValue =
      this.initialValue();

    if (mode === 'edit') {
      this.form.controls.code.disable();
      this.form.controls.isPrimary.disable();
    } else {
      this.form.controls.code.enable();
      this.form.controls.isPrimary.enable();
    }

    if (!initialValue) {
      return;
    }

    this.form.reset({
      name:
        initialValue.name,

      code:
        initialValue.code,

      branchType:
        initialValue.branchType,

      addressLine1:
        initialValue.addressLine1,

      addressLine2:
        initialValue.addressLine2,

      postalCode:
        initialValue.postalCode,

      city:
        initialValue.city,

      timeZoneId:
        initialValue.timeZoneId,

      isPrimary:
        initialValue.isPrimary,
    });
  });
}

  submit(): void {
    if (
      this.form.invalid ||
      this.submitting()
    ) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue =
      this.form.getRawValue();

    this.submitted.emit({
      name:
        rawValue.name.trim(),

      code:
        rawValue.code
          .trim()
          .toUpperCase(),

      branchType:
        rawValue.branchType,

      addressLine1:
        rawValue.addressLine1.trim(),

      addressLine2:
        rawValue.addressLine2.trim(),

      postalCode:
        rawValue.postalCode.trim(),

      city:
        rawValue.city.trim(),

      timeZoneId:
        rawValue.timeZoneId.trim(),

      isPrimary:
        rawValue.isPrimary,
    });
  }

  cancel(): void {
    if (this.submitting()) {
      return;
    }

    this.cancelled.emit();
  }
}
