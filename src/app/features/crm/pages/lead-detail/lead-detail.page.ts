import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsSpinnerComponent,
  DriveOsStateBannerComponent,
  DriveOsToastService,
} from '../../../../shared/ui';
import { LeadsApiService } from '../../data-access/leads-api.service';
import { LeadDetails, LeadSourceType, LeadStatus } from '../../models/lead.model';

@Component({
  selector: 'driveos-lead-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './lead-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(LeadsApiService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly lead = signal<LeadDetails | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly displayName = computed(() => {
    const lead = this.lead();
    return lead ? `${lead.firstName} ${lead.lastName}` : '';
  });

  private readonly leadId = this.route.snapshot.paramMap.get('leadId');

  constructor() {
    if (!this.leadId) {
      this.isLoading.set(false);
      void this.router.navigate(['/crm/leads']);
      return;
    }

    this.load();
  }

  goBack(): void { void this.router.navigate(['/crm/leads']); }
  reload(): void { this.load(); }
  statusKey(status: LeadStatus): string { return `crm.leads.statuses.${status}`; }
  sourceKey(source: LeadSourceType): string { return `crm.leads.sources.${source}`; }

  statusVariant(status: LeadStatus): DriveOsBadgeVariant {
    if (status === 'Won') return 'success';
    if (status === 'Lost') return 'danger';
    if (status === 'Dormant') return 'warning';
    return status === 'New' ? 'info' : 'neutral';
  }

  private load(): void {
    if (!this.leadId) return;

    this.isLoading.set(true);
    this.hasError.set(false);
    this.api.getById(this.leadId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (lead) => {
        this.lead.set(lead);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.hasError.set(true);
        for (const message of this.apiErrorService.getMessages(error)) {
          this.toast.error(this.translate.instant('errors.title'), message);
        }
      },
    });
  }
}
