import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { StudentsApiService } from '../../data-access/students-api.service';
import { StudentOverview } from '../../models/student.models';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { StudentContractSummaryComponent } from '../../../contracts/components/student-contract-summary/student-contract-summary.component';

@Component({
  selector: 'driveos-student-overview-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
    StudentContractSummaryComponent,
  ],
  templateUrl: './student-overview.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentOverviewPage {
  private readonly api = inject(StudentsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly data = signal<StudentOverview | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.api.getOverview(this.studentId).subscribe({
      next: (v) => {
        this.data.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
