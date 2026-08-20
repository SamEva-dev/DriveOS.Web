import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsBadgeVariant } from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { StudentInternalTransferPanelComponent } from '../../components/student-internal-transfer-panel/student-internal-transfer-panel.component';
import { StudentExternalTransferPanelComponent } from '../../components/student-external-transfer-panel/student-external-transfer-panel.component';
import { ExternalTransfer, InternalTransfer } from '../../models/student.models';

type MobilitySection = 'internal' | 'external';
interface MobilityTab {
  id: MobilitySection;
  route: string;
  labelKey: string;
  icon: string;
  permissions: readonly string[];
}

@Component({
  selector: 'driveos-student-mobility-page',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
    StudentInternalTransferPanelComponent,
    StudentExternalTransferPanelComponent,
  ],
  templateUrl: './student-mobility.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentMobilityPage {
  private readonly api = inject(StudentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly authorization = inject(AuthorizationService);
  private readonly tabs: readonly MobilityTab[] = [
    {
      id: 'internal',
      route: 'internal-transfers',
      labelKey: 'students.mobility.tabs.internal',
      icon: 'ph-buildings',
      permissions: [STUDENT_PERMISSIONS.transferInternal, STUDENT_PERMISSIONS.branchesRead],
    },
    {
      id: 'external',
      route: 'external-transfers',
      labelKey: 'students.mobility.tabs.external',
      icon: 'ph-globe-hemisphere-west',
      permissions: [STUDENT_PERMISSIONS.transferExternal],
    },
  ];
  readonly visibleTabs = computed(() => {
    this.authorization.permissions();
    return this.tabs.filter((tab) => this.authorization.hasAll(tab.permissions));
  });
  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly selected = signal<MobilitySection>(
    (this.route.snapshot.data['section'] as MobilitySection | undefined) ?? 'internal',
  );
  readonly internal = signal<readonly InternalTransfer[] | null>(null);
  readonly external = signal<readonly ExternalTransfer[] | null>(null);
  readonly loading = signal(true);
  constructor() {
    const requested = this.selected();
    const first = this.visibleTabs()[0];
    if (!this.visibleTabs().some((tab) => tab.id === requested) && first)
      this.selected.set(first.id);
    this.load();
  }
  load(): void {
    const id = this.studentId;
    this.loading.set(true);
    const internal$ = this.authorization.hasAll([
      STUDENT_PERMISSIONS.transferInternal,
      STUDENT_PERMISSIONS.branchesRead,
    ])
      ? this.api.getInternalTransfers(id).pipe(catchError(() => of(null)))
      : of(null);
    const external$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.transferExternal)
      ? this.api.getExternalTransfers(id).pipe(catchError(() => of(null)))
      : of(null);
    forkJoin({ internal: internal$, external: external$ }).subscribe((data) => {
      this.internal.set(data.internal);
      this.external.set(data.external);
      this.loading.set(false);
    });
  }
  variant(status: string): DriveOsBadgeVariant {
    if (['Completed', 'Accepted', 'Validated', 'Active', 'Approved'].includes(status))
      return 'success';
    if (['Rejected', 'Cancelled', 'Failed', 'Expired'].includes(status)) return 'danger';
    if (['Draft', 'Analyzed', 'Pending', 'Submitted', 'ReviewRequired'].includes(status))
      return 'warning';
    return 'neutral';
  }
}
