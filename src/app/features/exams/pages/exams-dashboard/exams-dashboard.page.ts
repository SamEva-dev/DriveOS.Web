import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { ExamsApiService } from '../../data-access/exams-api.service';
import { ExamAnalyticsResponse, ExamAnalyticsSeriesPoint } from '../../models/exams.models';

type DashboardTab = 'overview' | 'performance' | 'quality';
type Dimension = 'branch' | 'license' | 'type' | 'center' | 'instructor';

@Component({
  selector: 'driveos-exams-dashboard-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, TranslatePipe, DriveOsButtonComponent, DriveOsEmptyStateComponent, DriveOsInputDirective, DriveOsSpinnerComponent, DriveOsStateBannerComponent],
  templateUrl: './exams-dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamsDashboardPage {
  private readonly api = inject(ExamsApiService);
  private readonly errors = inject(ApiErrorService);

  readonly data = signal<ExamAnalyticsResponse | null>(null);
  readonly loading = signal(true);
  readonly messages = signal<readonly string[]>([]);
  readonly activeTab = signal<DashboardTab>('overview');
  readonly dimension = signal<Dimension>('branch');

  fromDate = '';
  toDate = '';
  examType = '';
  licenseCategory = '';

  readonly dimensionSeries = computed<readonly ExamAnalyticsSeriesPoint[]>(() => {
    const report = this.data();
    if (!report) return [];
    switch (this.dimension()) {
      case 'license': return report.byLicenseCategory;
      case 'type': return report.byExamType;
      case 'center': return report.byExamCenter;
      case 'instructor': return report.byInstructor;
      default: return report.byBranch;
    }
  });

  constructor() { this.load(); }

  setTab(tab: DashboardTab): void { this.activeTab.set(tab); }
  setDimension(value: Dimension): void { this.dimension.set(value); }

  load(): void {
    this.loading.set(true);
    this.messages.set([]);
    const fromUtc = this.fromDate ? new Date(`${this.fromDate}T00:00:00Z`).toISOString() : undefined;
    const toUtc = this.toDate ? new Date(`${this.toDate}T23:59:59Z`).toISOString() : undefined;
    this.api.getAnalytics({ fromUtc, toUtc, examType: this.examType || undefined, licenseCategory: this.licenseCategory || undefined }).subscribe({
      next: value => { this.data.set(value); this.loading.set(false); },
      error: (error: HttpErrorResponse) => { this.messages.set(this.errors.getMessages(error)); this.loading.set(false); },
    });
  }

  resetFilters(): void {
    this.fromDate = '';
    this.toDate = '';
    this.examType = '';
    this.licenseCategory = '';
    this.load();
  }

}
