import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/data-access/auth-api.service';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthShellComponent } from '../../components/auth-shell.component';


@Component({
  selector: 'driveos-confirm-email-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './confirm-email.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AuthApiService);
  readonly loading = signal(true);
  readonly success = signal(false);
  readonly error = signal('');
  email = this.route.snapshot.queryParamMap.get('email') ?? '';
  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  constructor() {
    void this.confirm();
  }
  async confirm() {
    try {
      await firstValueFrom(this.api.validateEmail(this.email, this.token));
      this.success.set(true);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Le lien de confirmation est invalide ou expiré.');
    } finally {
      this.loading.set(false);
    }
  }
  goLogin() {
    void this.router.navigate(['/login'], { queryParams: { email: this.email } });
  }
}
