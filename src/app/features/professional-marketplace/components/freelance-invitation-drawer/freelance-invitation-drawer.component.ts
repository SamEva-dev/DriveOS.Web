import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { SendFreelanceInvitationResponse } from '../../models/freelance-invitation.model';

@Component({
  selector: 'driveos-freelance-invitation-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './freelance-invitation-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FreelanceInvitationDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly auth = inject(AuthService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);

  readonly open = input(false);
  readonly professionalProfileId = input<string | null>(null);
  readonly professionalLabel = input<string | null>(null);
  readonly closeRequested = output<void>();
  readonly sent = output<SendFreelanceInvitationResponse>();

  readonly saving = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  readonly result = signal<SendFreelanceInvitationResponse | null>(null);

  branchId = '';
  missionId = '';
  invitedUserId = '';
  email = '';
  phone = '';
  message = '';
  expirationDate = this.defaultExpirationDate();

  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invitations.create),
  );
  readonly canSend = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invitations.send),
  );
  readonly canCreateAndSend = computed(() => this.canCreate() && this.canSend());

  close(): void {
    if (this.saving()) return;
    this.reset();
    this.closeRequested.emit();
  }

  submit(): void {
    if (!this.canCreateAndSend()) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.invitations.errors.permission'),
      ]);
      return;
    }
    const organizationId = this.organizationId();
    if (!organizationId) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.invitations.errors.organization'),
      ]);
      return;
    }
    if (!this.email.trim() && !this.phone.trim() && !this.professionalProfileId()) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.invitations.errors.recipientRequired'),
      ]);
      return;
    }
    if (!this.expirationDate) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.invitations.errors.expirationRequired'),
      ]);
      return;
    }

    this.saving.set(true);
    this.formErrors.set([]);
    this.result.set(null);
    this.api
      .createFreelanceInvitation(organizationId, {
        branchId: this.clean(this.branchId),
        missionId: this.clean(this.missionId),
        professionalProfileId: this.professionalProfileId(),
        invitedUserId: this.clean(this.invitedUserId),
        email: this.clean(this.email),
        phone: this.clean(this.phone),
        message: this.clean(this.message),
        expirationDate: this.expirationDate,
      })
      .subscribe({
        next: (created) => this.sendInvitation(organizationId, created.id),
        error: (error) => {
          this.formErrors.set(this.errors.getMessages(error));
          this.saving.set(false);
        },
      });
  }

  private sendInvitation(organizationId: string, invitationId: string): void {
    const publicBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    this.api.sendFreelanceInvitation(organizationId, invitationId, publicBaseUrl).subscribe({
      next: (response) => {
        this.result.set(response);
        this.saving.set(false);
        this.sent.emit(response);
      },
      error: (error) => {
        this.formErrors.set(this.errors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private clean(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private defaultExpirationDate(): string {
    const value = new Date();
    value.setDate(value.getDate() + 7);
    return value.toISOString().slice(0, 10);
  }

  private reset(): void {
    this.branchId = '';
    this.missionId = '';
    this.invitedUserId = '';
    this.email = '';
    this.phone = '';
    this.message = '';
    this.expirationDate = this.defaultExpirationDate();
    this.formErrors.set([]);
    this.result.set(null);
  }
}
