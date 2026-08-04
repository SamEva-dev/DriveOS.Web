import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../../core/errors/api-error.service';
import {
  DriveOsBadgeComponent,
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsInputDirective,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';
import { OrganizationConfigurationsApiService } from '../../data-access/organization-configurations-api.service';
import { ORGANIZATION_CONFIGURATION_PERMISSIONS as permissions } from '../../domain/organization-configuration-permissions';
import {
  OrganizationConfiguration,
  OrganizationConfigurationListItem,
  OrganizationConfigurationStatus,
} from '../../models/organization-configuration.model';

@Component({
  selector: 'driveos-organization-configurations-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './organization-configurations.page.html',
  styleUrl: './organization-configurations.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationConfigurationsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OrganizationConfigurationsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly versions = signal<readonly OrganizationConfigurationListItem[]>([]);
  readonly selected = signal<OrganizationConfiguration | null>(null);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly mode = signal<'view' | 'create' | 'edit' | 'publish' | 'archive'>('view');
  readonly jsonError = signal<string | null>(null);

  readonly canCreate = computed(() => this.authorization.hasPermission(permissions.create));
  readonly canUpdate = computed(() => this.authorization.hasPermission(permissions.update));
  readonly canPublish = computed(() => this.authorization.hasPermission(permissions.publish));
  readonly canArchive = computed(() => this.authorization.hasPermission(permissions.archive));

  readonly createForm = this.fb.nonNullable.group({
    versionNumber: [1, [Validators.required, Validators.min(1)]],
    countryCode: ['FR', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    payloadJson: ['{\n  "booking": {},\n  "training": {}\n}', Validators.required],
  });

  readonly editForm = this.fb.nonNullable.group({
    payloadJson: ['', Validators.required],
  });

  readonly publishForm = this.fb.nonNullable.group({
    effectiveFromUtc: [this.toLocalInput(new Date()), Validators.required],
    effectiveToUtc: [''],
  });

  constructor() {
    if (!this.organizationId) {
      void this.router.navigate(['/organizations']);
      return;
    }
    this.loadVersions();
  }

  select(item: OrganizationConfigurationListItem): void {
    if (this.saving()) return;
    this.mode.set('view');
    this.detailLoading.set(true);
    this.api.getById(this.organizationId, item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: value => {
          this.selected.set(value);
          this.detailLoading.set(false);
          this.jsonError.set(null);
        },
        error: error => {
          this.detailLoading.set(false);
          this.showErrors(error);
        },
      });
  }

  openCreate(): void {
    const nextVersion = Math.max(0, ...this.versions().map(x => x.versionNumber)) + 1;
    this.createForm.reset({
      versionNumber: nextVersion,
      countryCode: this.selected()?.countryCode ?? 'FR',
      payloadJson: '{\n  "booking": {},\n  "training": {}\n}',
    });
    this.jsonError.set(null);
    this.mode.set('create');
  }

  openEdit(): void {
    const current = this.selected();
    if (!current || current.status !== OrganizationConfigurationStatus.Draft || !this.canUpdate()) return;
    this.editForm.reset({ payloadJson: this.prettyJson(current.payloadJson) });
    this.jsonError.set(null);
    this.mode.set('edit');
  }

  openPublish(): void {
    const current = this.selected();
    if (!current || current.status !== OrganizationConfigurationStatus.Draft || !this.canPublish()) return;
    this.publishForm.reset({ effectiveFromUtc: this.toLocalInput(new Date()), effectiveToUtc: '' });
    this.mode.set('publish');
  }

  openArchive(): void {
    const current = this.selected();
    if (!current || current.status !== OrganizationConfigurationStatus.Published || !this.canArchive()) return;
    this.mode.set('archive');
  }

  cancelMode(): void {
    if (!this.saving()) this.mode.set('view');
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.saving()) {
      this.createForm.markAllAsTouched();
      return;
    }
    const value = this.createForm.getRawValue();
    const payloadJson = this.normalizeJson(value.payloadJson);
    if (!payloadJson) return;

    this.saving.set(true);
    this.api.createDraft(this.organizationId, {
      versionNumber: value.versionNumber,
      countryCode: value.countryCode.trim().toUpperCase(),
      payloadJson,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => this.afterMutation(result.id),
      error: error => this.onMutationError(error),
    });
  }

  submitEdit(): void {
    const current = this.selected();
    if (!current || this.editForm.invalid || this.saving()) {
      this.editForm.markAllAsTouched();
      return;
    }
    const payloadJson = this.normalizeJson(this.editForm.controls.payloadJson.value);
    if (!payloadJson) return;

    this.saving.set(true);
    this.api.updateDraft(this.organizationId, current.id, {
      payloadJson,
      expectedRevision: current.revision,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.afterMutation(current.id),
      error: error => this.onMutationError(error),
    });
  }

  submitPublish(): void {
    const current = this.selected();
    if (!current || this.publishForm.invalid || this.saving()) {
      this.publishForm.markAllAsTouched();
      return;
    }
    const value = this.publishForm.getRawValue();
    const from = this.toUtc(value.effectiveFromUtc);
    const to = this.toUtc(value.effectiveToUtc);
    if (!from || (to && new Date(to) <= new Date(from))) {
      this.toast.error(
        this.translate.instant('errors.title'),
        this.translate.instant('organizations.configurations.validation.invalidPeriod'),
      );
      return;
    }

    this.saving.set(true);
    this.api.publish(this.organizationId, current.id, {
      effectiveFromUtc: from,
      effectiveToUtc: to,
      expectedRevision: current.revision,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.afterMutation(current.id),
      error: error => this.onMutationError(error),
    });
  }

  submitArchive(): void {
    const current = this.selected();
    if (!current || this.saving()) return;
    this.saving.set(true);
    this.api.archive(this.organizationId, current.id, { expectedRevision: current.revision })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.afterMutation(current.id),
        error: error => this.onMutationError(error),
      });
  }

  statusLabel(status: OrganizationConfigurationStatus): string {
    return `organizations.configurations.status.${OrganizationConfigurationStatus[status]}`;
  }

  statusVariant(status: OrganizationConfigurationStatus): 'neutral' | 'info' | 'success' {
    if (status === OrganizationConfigurationStatus.Draft) return 'info';
    if (status === OrganizationConfigurationStatus.Published) return 'success';
    return 'neutral';
  }

  isSelected(id: string): boolean {
    return this.selected()?.id === id;
  }

  prettyJson(value: string): string {
    try { return JSON.stringify(JSON.parse(value), null, 2); }
    catch { return value; }
  }

  private loadVersions(selectId?: string): void {
    this.loading.set(true);
    this.api.getVersions(this.organizationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: values => {
          this.versions.set(values);
          this.loading.set(false);
          const target = selectId ? values.find(x => x.id === selectId) : values[0];
          if (target) this.select(target);
          else this.selected.set(null);
        },
        error: error => {
          this.loading.set(false);
          this.showErrors(error);
        },
      });
  }

  private afterMutation(configurationId: string): void {
    this.saving.set(false);
    this.mode.set('view');
    this.toast.success(this.translate.instant('organizations.configurations.messages.saved'));
    this.loadVersions(configurationId);
  }

  private onMutationError(error: HttpErrorResponse): void {
    this.saving.set(false);
    if (error.status === 409) {
      this.toast.error(
        this.translate.instant('errors.title'),
        this.translate.instant('organizations.configurations.messages.conflict'),
      );
      this.loadVersions(this.selected()?.id);
      return;
    }
    this.showErrors(error);
  }

  private normalizeJson(value: string): string | null {
    try {
      const parsed: unknown = JSON.parse(value);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('root');
      this.jsonError.set(null);
      return JSON.stringify(parsed);
    } catch {
      this.jsonError.set(this.translate.instant('organizations.configurations.validation.invalidJson'));
      return null;
    }
  }

  private showErrors(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error)) {
      this.toast.error(this.translate.instant('errors.title'), message);
    }
  }

  private toUtc(value: string): string | null {
    return value ? new Date(value).toISOString() : null;
  }

  private toLocalInput(value: Date): string {
    const offset = value.getTimezoneOffset() * 60000;
    return new Date(value.getTime() - offset).toISOString().slice(0, 16);
  }
}
