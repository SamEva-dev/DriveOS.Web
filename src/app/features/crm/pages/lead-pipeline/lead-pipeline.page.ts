import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsBadgeComponent, DriveOsButtonComponent, DriveOsSpinnerComponent, DriveOsStateBannerComponent, DriveOsToastService } from '../../../../shared/ui';
import { LeadsApiService } from '../../data-access/leads-api.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import { LeadLifecycleActionDefinition, getLeadLifecycleActions } from '../../domain/lead-lifecycle';
import { LeadListItem, LeadStatus } from '../../models/lead.model';

const PIPELINE_STATUSES: readonly LeadStatus[] = [
  'New', 'Contacted', 'Qualified', 'AssessmentScheduled',
  'OfferSent', 'Negotiation', 'Won', 'Lost', 'Dormant',
];

@Component({
  selector: 'driveos-lead-pipeline-page',
  standalone: true,
  imports: [TranslatePipe, DriveOsBadgeComponent, DriveOsButtonComponent, DriveOsSpinnerComponent, DriveOsStateBannerComponent],
  templateUrl: './lead-pipeline.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadPipelinePage {
  private readonly api = inject(LeadsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);

  readonly statuses = PIPELINE_STATUSES;
  readonly leads = signal<readonly LeadListItem[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly totalCount = signal(0);
  readonly pendingLossLeadId = signal<string | null>(null);
  readonly lossReason = signal('');
  readonly isTruncated = computed(() => this.totalCount() > this.leads().length);
  readonly canChangeStatus = computed(() =>
    this.authorization.hasPermission(CRM_PERMISSIONS.leads.changeStatus));

  constructor() { this.load(); }

  leadsFor(status: LeadStatus): readonly LeadListItem[] {
    return this.leads().filter((lead) => lead.status === status);
  }

  actionsFor(status: LeadStatus): readonly LeadLifecycleActionDefinition[] {
    return this.canChangeStatus() ? getLeadLifecycleActions(status) : [];
  }

  lossActionFor(status: LeadStatus): LeadLifecycleActionDefinition | null {
    return this.actionsFor(status).find((action) => action.code === 'lose') ?? null;
  }

  openLead(leadId: string): void { void this.router.navigate(['/crm/leads', leadId]); }
  statusKey(status: LeadStatus): string { return `crm.leads.statuses.${status}`; }
  actionKey(action: LeadLifecycleActionDefinition): string {
    return `crm.lifecycle.actions.${action.code}`;
  }

  apply(lead: LeadListItem, action: LeadLifecycleActionDefinition): void {
    if (action.requiresReason) {
      this.pendingLossLeadId.set(lead.id);
      this.lossReason.set('');
      return;
    }

    this.commit(lead, action);
  }

  confirmLoss(lead: LeadListItem, action: LeadLifecycleActionDefinition): void {
    const reason = this.lossReason().trim();
    if (!reason) return;
    this.commit(lead, action, reason);
  }

  cancelLoss(): void {
    this.pendingLossLeadId.set(null);
    this.lossReason.set('');
  }

  updateLossReason(event: Event): void {
    this.lossReason.set((event.target as HTMLInputElement).value);
  }

  private commit(lead: LeadListItem, action: LeadLifecycleActionDefinition, reason?: string): void {
    this.api.changeStatus(lead.id, action.code, reason)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.leads.update((items) => items.map((item) =>
            item.id === lead.id ? { ...item, status: action.targetStatus } : item));
          this.toast.success(
            this.translate.instant('crm.lifecycle.title'),
            this.translate.instant('crm.lifecycle.changeSuccess'));
          this.cancelLoss();
        },
        error: (error: HttpErrorResponse) => {
          for (const message of this.apiErrorService.getMessages(error)) {
            this.toast.error(this.translate.instant('errors.title'), message);
          }
        },
      });
  }

  reload(): void { this.load(); }

  private load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.api.getPipeline().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.leads.set(page.items);
        this.totalCount.set(page.totalCount);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }
}
