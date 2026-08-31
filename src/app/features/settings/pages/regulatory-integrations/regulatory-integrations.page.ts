import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { BranchesApiService } from '../../../organizations/branches/data-access/branches-api.service';
import { BranchListItem } from '../../../organizations/branches/models/branch-list-item';
import { RegulatoryIntegrationsApiService } from '../../data-access/regulatory-integrations-api.service';
import { REGULATORY_INTEGRATIONS_PERMISSIONS } from '../../domain/regulatory-integrations-permissions';
import {
  RegulatoryIntegrationConnection,
  RegulatorySubmissionDetail,
  RegulatorySubmissionListItem,
  RegulatorySynchronizationSummary,
} from '../../models/regulatory-integrations.models';

@Component({
  selector: 'driveos-regulatory-integrations-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './regulatory-integrations.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegulatoryIntegrationsPage {
  private readonly api = inject(RegulatoryIntegrationsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);

  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  readonly canManage = computed(() =>
    this.authorization.hasPermission(REGULATORY_INTEGRATIONS_PERMISSIONS.manage),
  );
  readonly canReadSubmissions = computed(() =>
    this.authorization.hasPermission(REGULATORY_INTEGRATIONS_PERMISSIONS.submissionsRead),
  );
  readonly canManageSubmissions = computed(() =>
    this.authorization.hasPermission(REGULATORY_INTEGRATIONS_PERMISSIONS.submissionsManage),
  );
  readonly loading = signal(false);
  readonly connections = signal<readonly RegulatoryIntegrationConnection[]>([]);
  readonly branches = signal<readonly BranchListItem[]>([]);
  readonly summary = signal<RegulatorySynchronizationSummary | null>(null);
  readonly summaryCards = computed(() => {
    const summary = this.summary();
    if (!summary) return [];

    return [
      { key: 'total', value: summary.total, status: '' },
      { key: 'accepted', value: summary.accepted, status: 'Accepted' },
      { key: 'waitingForData', value: summary.waitingForData, status: 'WaitingForData' },
      { key: 'rejected', value: summary.rejected, status: 'Rejected' },
      { key: 'retryPending', value: summary.retryPending, status: 'RetryPending' },
    ] as const;
  });
  readonly submissions = signal<readonly RegulatorySubmissionListItem[]>([]);
  readonly selectedStatus = signal('');
  readonly errorMessages = signal<readonly string[]>([]);
  readonly drawerOpen = signal(false);
  readonly detail = signal<RegulatorySubmissionDetail | null>(null);
  readonly editing = signal<RegulatoryIntegrationConnection | null>(null);

  branchId = '';
  externalAccountReference = '';
  secretReference = '';

  constructor() {
    this.reload();
  }

  reload(): void {
    const organizationId = this.organizationId();
    if (!organizationId) return;
    this.loading.set(true);
    this.errorMessages.set([]);
    const requests: any = {
      connections: this.api.getConnections(organizationId),
      branches: this.branchesApi.getPaged(organizationId, {
        pageNumber: 1,
        pageSize: 100,
        search: '',
        sortBy: 'name',
        sortDirection: 'asc',
      }),
    };
    if (this.canReadSubmissions()) {
      requests.summary = this.api.getSummary();
      requests.submissions = this.api.getSubmissions(this.selectedStatus() || undefined);
    }
    forkJoin(requests).subscribe({
      next: (result: any) => {
        this.connections.set(result.connections ?? []);
        this.branches.set(result.branches?.items ?? []);
        if (result.summary) this.summary.set(result.summary);
        if (result.submissions) this.submissions.set(result.submissions.items ?? []);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessages.set(this.errors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  filter(status: string): void {
    this.selectedStatus.set(status);
    this.reload();
  }

  openCreate(): void {
    this.editing.set(null);
    this.branchId = '';
    this.externalAccountReference = '';
    this.secretReference = '';
    this.drawerOpen.set(true);
  }

  openEdit(connection: RegulatoryIntegrationConnection): void {
    this.editing.set(connection);
    this.branchId = connection.branchId ?? '';
    this.externalAccountReference = connection.externalAccountReference;
    this.secretReference = '';
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editing.set(null);
  }

  saveConnection(): void {
    const organizationId = this.organizationId();
    if (!organizationId || !this.externalAccountReference.trim()) return;
    const current = this.editing();
    const observer = {
      next: () => {
        this.closeDrawer();
        this.reload();
      },
      error: (e: HttpErrorResponse) => this.errorMessages.set(this.errors.getMessages(e)),
    };

    if (current) {
      this.api
        .updateConnection(organizationId, current.id, {
          externalAccountReference: this.externalAccountReference.trim(),
          secretReference: this.secretReference.trim() || null,
          expectedRevision: current.revision,
        })
        .subscribe(observer);
      return;
    }

    this.api
      .createConnection(organizationId, {
        branchId: this.branchId || null,
        countryCode: 'FR',
        providerCode: 'fr-livret-numerique',
        externalAccountReference: this.externalAccountReference.trim(),
        secretReference: this.secretReference.trim() || null,
      })
      .subscribe(observer);
  }

  setStatus(connection: RegulatoryIntegrationConnection, status: string): void {
    this.api
      .changeConnectionStatus(this.organizationId(), connection.id, status, connection.revision)
      .subscribe({
        next: () => this.reload(),
        error: (e: HttpErrorResponse) => this.errorMessages.set(this.errors.getMessages(e)),
      });
  }

  openSubmission(item: RegulatorySubmissionListItem): void {
    this.api
      .getSubmission(item.id)
      .subscribe({
        next: (value) => this.detail.set(value),
        error: (e: HttpErrorResponse) => this.errorMessages.set(this.errors.getMessages(e)),
      });
  }

  closeDetail(): void {
    this.detail.set(null);
  }
  reconcile(id: string): void {
    this.api.reconcile(id).subscribe({
      next: () => {
        this.closeDetail();
        this.reload();
      },
      error: (e: HttpErrorResponse) => this.errorMessages.set(this.errors.getMessages(e)),
    });
  }
  retry(id: string): void {
    this.api.retry(id).subscribe({
      next: () => {
        this.closeDetail();
        this.reload();
      },
      error: (e: HttpErrorResponse) => this.errorMessages.set(this.errors.getMessages(e)),
    });
  }
  branchName(id: string | null): string {
    return id ? (this.branches().find((x) => x.id === id)?.name ?? id) : '—';
  }
}
