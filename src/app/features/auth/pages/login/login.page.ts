import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthShellComponent } from '../../components/auth-shell.component';

@Component({
  selector: 'driveos-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly apiErrors = inject(ApiErrorService);

  readonly step = signal<'email' | 'password'>('email');
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly rememberMe = signal(this.auth.getRememberMe());
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  password = '';

  async continue(): Promise<void> {
    this.error.set('');
    if (!this.email.trim()) return;
    this.loading.set(true);
    try {
      const result = await this.auth.preLogin(this.email);
      if (result.nextStep === 'Register' || result.nextStep === 'RegisterApplication') {
        await this.router.navigate(['/register'], {
          queryParams: {
            email: this.email.trim().toLowerCase(),
            returnUrl: this.route.snapshot.queryParamMap.get('returnUrl'),
          },
        });
        return;
      }
      if (result.nextStep === 'Password') this.step.set('password');
      else this.error.set(result.error ?? 'Une erreur est survenue.');
    } catch (error) {
      this.error.set(this.apiErrors.getMessages(error)[0]);
    } finally {
      this.loading.set(false);
    }
  }

  async login(): Promise<void> {
    this.error.set('');
    this.loading.set(true);
    try {
      this.auth.setRememberMe(this.rememberMe());
      await this.auth.login(this.email, this.password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
      await this.router.navigateByUrl(returnUrl);
    } catch (error) {
      const message = this.auth.getBackendErrorMessage(error);
      this.error.set(
        message === 'MFA_REQUIRED'
          ? 'La vérification à deux facteurs sera intégrée dans AUTH-02.'
          : (message ?? this.apiErrors.getMessages(error)[0]),
      );
    } finally {
      this.loading.set(false);
    }
  }

  changeEmail(): void {
    this.password = '';
    this.step.set('email');
  }
}
