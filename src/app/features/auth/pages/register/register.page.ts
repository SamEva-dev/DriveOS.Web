import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthShellComponent } from '../../components/auth-shell.component';

@Component({
  selector: 'driveos-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './register.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly error = signal('');
  organizationName = '';
  firstName = '';
  lastName = '';
  phone = '';
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  password = '';
  confirmPassword = '';
  async submit(): Promise<void> {
    if (this.password !== this.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await this.auth.register({
        organizationName: this.organizationName.trim(),
        firstName: this.firstName.trim(),
        lastName: this.lastName.trim(),
        phone: this.phone.trim() || undefined,
        email: this.email.trim().toLowerCase(),
        password: this.password,
      });
      if (response.status === 'application_added') {
        await this.router.navigate(['/login'], {
          queryParams: { email: response.email, applicationAdded: '1' },
        });
      } else if (this.auth.isAuthenticated()) {
        await this.router.navigate(['/dashboard']);
      } else {
        await this.router.navigate(['/check-email'], {
          queryParams: { email: response.email, type: 'verify' },
        });
      }
    } catch (error) {
      this.error.set(this.auth.getBackendErrorMessage(error) ?? 'Inscription impossible.');
    } finally {
      this.loading.set(false);
    }
  }
}
