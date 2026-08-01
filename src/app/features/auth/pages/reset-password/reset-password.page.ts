import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/data-access/auth-api.service';
import { AuthShellComponent } from '../../components/auth-shell.component';

@Component({
  selector: 'driveos-reset-password-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './reset-password.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  password = '';
  confirmPassword = '';
  async submit() {
    if (this.password !== this.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(
        this.api.resetPassword(this.email, this.token, this.password, this.confirmPassword),
      );
      await this.router.navigate(['/login'], { queryParams: { email: this.email } });
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Réinitialisation impossible.');
    } finally {
      this.loading.set(false);
    }
  }
}
