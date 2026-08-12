import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsCardComponent, DriveOsSpinnerComponent, DriveOsToastService } from '../../../../shared/ui';
import { CrmActivitiesApiService } from '../../data-access/crm-activities-api.service';
import { CrmActivity } from '../../models/crm-activity.model';

@Component({
  selector: 'driveos-activity-list-page',
  standalone: true,
  imports: [DatePipe, TranslatePipe, DriveOsCardComponent, DriveOsSpinnerComponent],
  templateUrl: './activity-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityListPage {
  private readonly api = inject(CrmActivitiesApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly activities = signal<CrmActivity[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.api.getRecent().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: activities => { this.activities.set(activities); this.loading.set(false); },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        for (const message of this.errors.getMessages(error))
          this.toast.error(this.translate.instant('errors.title'), message);
      },
    });
  }

  open(activity: CrmActivity): void {
    void this.router.navigate(['/crm/leads', activity.leadId]);
  }
}
