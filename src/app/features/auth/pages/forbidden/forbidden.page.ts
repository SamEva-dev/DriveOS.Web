import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthShellComponent } from "../../components/auth-shell.component";

@Component({
  selector: 'driveos-forbidden-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe, AuthShellComponent],
  templateUrl: './forbidden.page.html',
  styleUrl: './forbidden.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenPage {
  private readonly route = inject(ActivatedRoute);

  readonly returnUrl = computed(() => {
    const value = this.route.snapshot.queryParamMap.get(
      'returnUrl',
    );

    return value?.startsWith('/')
      ? value
      : '/organizations';
  });
}
