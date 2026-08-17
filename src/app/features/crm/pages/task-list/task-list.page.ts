import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../shared/ui';
import { CrmTasksApiService } from '../../data-access/crm-tasks-api.service';
import { CrmTask } from '../../models/crm-task.model';

@Component({
  selector: 'driveos-task-list-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './task-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListPage {
  private readonly api = inject(CrmTasksApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);
  readonly tasks = signal<CrmTask[]>([]);
  readonly loading = signal(true);
  constructor() {
    this.load();
  }
  open(task: CrmTask): void {
    void this.router.navigate(['/crm/leads', task.leadId]);
  }
  isOverdue(task: CrmTask): boolean {
    return new Date(task.dueAtUtc).getTime() < Date.now();
  }
  private load(): void {
    this.api
      .getPending()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          for (const m of this.errors.getMessages(error))
            this.toast.error(this.translate.instant('errors.title'), m);
        },
      });
  }
}
