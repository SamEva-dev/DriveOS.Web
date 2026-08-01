import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/data-access/auth-api.service';
import { AuthShellComponent } from '../../components/auth-shell.component';

@Component({
  selector: 'driveos-check-email-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './check-email.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckEmailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AuthApiService);
  readonly loading = signal(false);
  readonly sent = signal(false);
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  type = (this.route.snapshot.queryParamMap.get('type') === 'reset' ? 'reset' : 'verify') as
    'reset' | 'verify';
  async resend() {
    this.loading.set(true);
    try {
      if (this.type === 'verify')
        await firstValueFrom(this.api.resendEmailConfirmation(this.email));
      else await firstValueFrom(this.api.requestPasswordReset(this.email));
      this.sent.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
