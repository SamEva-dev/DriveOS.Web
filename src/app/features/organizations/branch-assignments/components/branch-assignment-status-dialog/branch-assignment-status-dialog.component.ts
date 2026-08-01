import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';

import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { TranslatePipe } from '@ngx-translate/core';

import { DriveOsButtonComponent, DriveOsInputDirective } from '../../../../../shared/ui';

import {
  BRANCH_ASSIGNMENT_LIFECYCLE_ACTIONS,
  BranchAssignmentLifecycleAction,
} from '../../models/branch-assignment-lifecycle-action';

@Component({
  selector: 'app-branch-assignment-status-dialog',

  standalone: true,

  imports: [ReactiveFormsModule, TranslatePipe, DriveOsButtonComponent, DriveOsInputDirective],

  templateUrl: './branch-assignment-status-dialog.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAssignmentStatusDialogComponent {
  private readonly openState = signal(false);

  private readonly actionState = signal<BranchAssignmentLifecycleAction | null>(null);

  private readonly assignmentIdState = signal<string | null>(null);

  readonly loading = signal(false);

  readonly reasonControl = new FormControl('', {
    nonNullable: true,

    validators: [Validators.required, Validators.maxLength(500)],
  });

  readonly isOpen = this.openState.asReadonly();

  readonly action = this.actionState.asReadonly();

  readonly definition = computed(() => {
    const action = this.actionState();

    return action ? BRANCH_ASSIGNMENT_LIFECYCLE_ACTIONS[action] : null;
  });

  @Input()
  set submitting(value: boolean) {
    this.loading.set(value);
  }

  @Output()
  readonly confirmed = new EventEmitter<{
    assignmentId: string;

    action: BranchAssignmentLifecycleAction;

    reason: string;
  }>();

  open(assignmentId: string, action: BranchAssignmentLifecycleAction): void {
    this.assignmentIdState.set(assignmentId);

    this.actionState.set(action);

    this.reasonControl.reset('');

    this.openState.set(true);
  }

  close(): void {
    if (this.loading()) {
      return;
    }

    this.openState.set(false);

    this.actionState.set(null);

    this.assignmentIdState.set(null);

    this.reasonControl.reset('');
  }

  confirm(): void {
    this.reasonControl.markAsTouched();

    if (this.reasonControl.invalid || this.loading()) {
      return;
    }

    const assignmentId = this.assignmentIdState();

    const action = this.actionState();

    if (!assignmentId || !action) {
      return;
    }

    this.confirmed.emit({
      assignmentId,
      action,
      reason: this.reasonControl.value.trim(),
    });
  }
}
