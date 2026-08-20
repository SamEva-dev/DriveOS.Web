import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
} from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { ContractsApiService } from '../../data-access/contracts-api.service';
import { CONTRACTS_PERMISSIONS } from '../../domain/contracts-permissions';
import {
  TrainingContractDetail,
  TrainingContractListItem,
} from '../../models/training-contract.models';

@Component({
  selector: 'driveos-student-contract-summary',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './student-contract-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentContractSummaryComponent {
  private readonly api = inject(ContractsApiService);
  private readonly authorization = inject(AuthorizationService);

  readonly studentId = input.required<string>();
  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly contracts = signal<readonly TrainingContractListItem[]>([]);
  readonly primary = signal<TrainingContractListItem | null>(null);
  readonly detail = signal<TrainingContractDetail | null>(null);

  readonly canRead = computed(() => {
    this.authorization.permissions();
    return this.authorization.hasPermission(CONTRACTS_PERMISSIONS.read);
  });

  readonly requiredSignatureCount = computed(
    () =>
      this.detail()?.currentSignatureProcess?.recipients.filter((recipient) => recipient.isRequired)
        .length ?? 0,
  );

  readonly signedRequiredCount = computed(
    () =>
      this.detail()?.currentSignatureProcess?.recipients.filter(
        (recipient) => recipient.isRequired && recipient.hasSigned,
      ).length ?? 0,
  );

  readonly attentionKey = computed(() => {
    const contract = this.primary();
    if (!contract) return 'contracts.training.summary.alerts.missing';

    switch (contract.status) {
      case 'Draft':
        return 'contracts.training.summary.alerts.draft';
      case 'Generated':
        return 'contracts.training.summary.alerts.generated';
      case 'SentForSignature':
      case 'PartiallySigned':
        return 'contracts.training.summary.alerts.signature';
      case 'Signed':
        return 'contracts.training.summary.alerts.activation';
      case 'Suspended':
        return 'contracts.training.summary.alerts.suspended';
      default:
        return null;
    }
  });

  constructor() {
    effect(() => {
      this.authorization.permissions();
      const studentId = this.studentId();
      if (!studentId || !this.authorization.hasPermission(CONTRACTS_PERMISSIONS.read)) {
        this.loading.set(false);
        this.contracts.set([]);
        this.primary.set(null);
        this.detail.set(null);
        return;
      }

      this.load(studentId);
    });
  }

  statusVariant(status: string): DriveOsBadgeVariant {
    switch (status) {
      case 'Active':
      case 'Amended':
      case 'Signed':
      case 'Completed':
        return 'success';
      case 'Generated':
      case 'SentForSignature':
      case 'PartiallySigned':
        return 'info';
      case 'Draft':
      case 'Suspended':
        return 'warning';
      case 'Terminated':
      case 'Expired':
      case 'Cancelled':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  private load(studentId: string): void {
    this.loading.set(true);
    this.loadFailed.set(false);

    this.api.getTrainingContracts(studentId).subscribe({
      next: (contracts) => {
        this.contracts.set(contracts);
        const primary = this.selectPrimary(contracts);
        this.primary.set(primary);

        if (!primary) {
          this.detail.set(null);
          this.loading.set(false);
          return;
        }

        this.api.getTrainingContract(primary.id).subscribe({
          next: (detail) => {
            this.detail.set(detail);
            this.loading.set(false);
          },
          error: () => {
            // The list remains useful for the 360 summary even if the detail projection is temporarily unavailable.
            this.detail.set(null);
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.loadFailed.set(true);
        this.contracts.set([]);
        this.primary.set(null);
        this.detail.set(null);
        this.loading.set(false);
      },
    });
  }

  private selectPrimary(
    contracts: readonly TrainingContractListItem[],
  ): TrainingContractListItem | null {
    if (!contracts.length) return null;

    const rank: Record<string, number> = {
      Active: 0,
      Amended: 1,
      Suspended: 2,
      Signed: 3,
      PartiallySigned: 4,
      SentForSignature: 5,
      Generated: 6,
      Draft: 7,
      Completed: 8,
      Terminated: 9,
      Expired: 10,
      Cancelled: 11,
    };

    return (
      [...contracts].sort((left, right) => {
        const statusDelta = (rank[left.status] ?? 99) - (rank[right.status] ?? 99);
        if (statusDelta !== 0) return statusDelta;
        return new Date(right.createdAtUtc).getTime() - new Date(left.createdAtUtc).getTime();
      })[0] ?? null
    );
  }
}
