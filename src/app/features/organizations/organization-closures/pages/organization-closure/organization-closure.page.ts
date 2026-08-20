import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrganizationClosureApiService } from '../../data-access/organization-closure-api.service';
import { OrganizationClosure } from '../../models/organization-closure.model';

@Component({
  selector: 'drive-os-organization-closure',
  standalone: true,
  templateUrl: './organization-closure.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationClosurePage {
  private readonly api = inject(OrganizationClosureApiService);
  private readonly route = inject(ActivatedRoute);
  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly closures = signal<readonly OrganizationClosure[]>([]);
  readonly loading = signal(false);
  load(): void {
    this.loading.set(true);
    this.api.list(this.organizationId).subscribe({
      next: (x) => this.closures.set(x),
      complete: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }
}
