import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthShellComponent } from '../../../auth/components/auth-shell.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PublicFreelanceInvitation } from '../../models/freelance-invitation.model';

@Component({
  selector: 'driveos-freelance-invitation-page',
  standalone: true,
  imports: [TranslatePipe, AuthShellComponent],
  template: `
    <driveos-auth-shell [subtitle]="'freelanceInvitationPublic.subtitle' | translate">
      @if (loading()) {
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ 'common.loading' | translate }}</p>
      } @else if (error()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{{ error() }}</div>
      } @else if (invitation(); as item) {
        <div class="space-y-5">
          <div>
            <h1 class="text-xl font-bold text-slate-950 dark:text-white">{{ 'freelanceInvitationPublic.title' | translate }}</h1>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ item.message || ('freelanceInvitationPublic.defaultMessage' | translate) }}</p>
          </div>
          <dl class="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
            <div class="flex justify-between gap-4"><dt>{{ 'freelanceInvitationPublic.expires' | translate }}</dt><dd class="font-semibold">{{ item.expirationDate }}</dd></div>
          </dl>
          <div class="flex flex-wrap gap-3">
            <button type="button" class="rounded-lg bg-blue-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" [disabled]="submitting()" (click)="accept()">
              {{ (auth.isAuthenticated() ? 'freelanceInvitationPublic.accept' : 'freelanceInvitationPublic.signInToAccept') | translate }}
            </button>
            <button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200" [disabled]="submitting()" (click)="decline()">
              {{ 'freelanceInvitationPublic.decline' | translate }}
            </button>
          </div>
        </div>
      }
    </driveos-auth-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FreelanceInvitationPage {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly errors = inject(ApiErrorService);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly invitation = signal<PublicFreelanceInvitation | null>(null);
  private readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

  constructor() {
    if (!this.token) {
      this.loading.set(false);
      this.error.set('Lien d’invitation invalide.');
      return;
    }
    this.api.openFreelanceInvitation(this.token).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (invitation) => this.invitation.set(invitation),
      error: (error) => this.error.set(this.errors.getMessages(error)[0]),
    });
  }

  accept(): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.submitting.set(true);
    this.api.acceptFreelanceInvitation(this.token).pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: (result) => void this.router.navigate([result.professionalProfileRequired ? '/marketplace/my-dashboard' : '/marketplace']),
      error: (error) => this.error.set(this.errors.getMessages(error)[0]),
    });
  }

  decline(): void {
    this.submitting.set(true);
    this.api.declineFreelanceInvitation(this.token, null).pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => void this.router.navigate(['/login']),
      error: (error) => this.error.set(this.errors.getMessages(error)[0]),
    });
  }
}
