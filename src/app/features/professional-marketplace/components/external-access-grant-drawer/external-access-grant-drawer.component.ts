import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import {
  CreateExternalAccessGrantRequest,
  ExternalAccessGrant,
  ExternalAccessResourceType,
} from '../../models/external-access-grant.model';
import { ProfessionalEngagement } from '../../models/professional-engagement.model';
import { ProfessionalMission } from '../../models/professional-mission.model';

@Component({
  selector: 'driveos-external-access-grant-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './external-access-grant-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalAccessGrantDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly engagement = input<ProfessionalEngagement | null>(null);
  readonly missions = input<readonly ProfessionalMission[]>([]);
  readonly grant = input<ExternalAccessGrant | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly busy = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  readonly mode = computed(() => (this.grant() ? 'detail' : 'create'));
  readonly canManage = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.accessGrants.manage),
  );
  readonly canRevoke = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.accessGrants.revoke),
  );
  readonly resourceTypes: readonly ExternalAccessResourceType[] = ['Mission'];
  resourceType: ExternalAccessResourceType = 'Mission';
  resourceId = '';
  permission = 'READ';
  startDate = '';
  endDate = '';
  revokeReason = '';
  constructor() {
    effect(() => {
      if (this.open()) {
        this.formErrors.set([]);
        this.revokeReason = '';
        const e = this.engagement();
        if (!this.grant() && e) {
          this.resourceType = 'Mission';
          this.resourceId = '';
          this.permission = 'READ';
          this.startDate = e.terms.startsOn;
          this.endDate = e.terms.endsOn;
        }
      }
    });
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  create() {
    const e = this.engagement(),
      org = this.auth.user()?.organizationId;
    if (!e || !org || !this.canManage()) return;
    const rid = this.resourceId.trim();
    if (!rid || !this.permission.trim()) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.accessGrants.errors.required'),
      ]);
      return;
    }
    const request: CreateExternalAccessGrantRequest = {
      resourceType: this.resourceType,
      resourceId: rid,
      permission: this.permission.trim().toUpperCase(),
      startDate: this.startDate,
      endDate: this.endDate,
    };
    this.run(() => this.api.createExternalAccessGrant(org, e.id, request));
  }
  revoke() {
    const g = this.grant(),
      org = this.auth.user()?.organizationId,
      reason = this.revokeReason.trim();
    if (!g || !org || !this.canRevoke()) return;
    if (reason.length < 2) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.accessGrants.errors.reason'),
      ]);
      return;
    }
    this.run(() => this.api.revokeExternalAccessGrant(org, g.id, reason));
  }
  private run(factory: () => any) {
    this.busy.set(true);
    this.formErrors.set([]);
    factory().subscribe({
      next: () => {
        this.busy.set(false);
        this.changed.emit();
        this.closeRequested.emit();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
}
