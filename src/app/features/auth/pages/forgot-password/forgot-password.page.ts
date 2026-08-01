import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/data-access/auth-api.service';
import { AuthShellComponent } from '../../components/auth-shell.component';


@Component({
  selector: 'driveos-forgot-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './forgot-password.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordPage {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly loading = signal(false);
  readonly error = signal('');
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  async submit() {
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.api.requestPasswordReset(this.email.trim().toLowerCase()));
      await this.router.navigate(['/check-email'], {
        queryParams: { email: this.email, type: 'reset' },
      });
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Envoi impossible.');
    } finally {
      this.loading.set(false);
    }
  }
}
