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
import { forkJoin } from 'rxjs';
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
import {
  OrganizationConfigurationListItem,
  OrganizationConfigurationStatus,
} from '../../../organization-configurations/models/organization-configuration.model';
import { BranchConfigurationOverridesApiService } from '../../data-access/branch-configuration-overrides-api.service';
import { BRANCH_CONFIGURATION_OVERRIDE_PERMISSIONS as permissions } from '../../domain/branch-configuration-override-permissions';
import {
  BranchConfigurationOverride,
  BranchConfigurationOverrideListItem,
  BranchConfigurationOverrideStatus,
} from '../../models/branch-configuration-override.model';

@Component({
  selector: 'driveos-branch-configuration-overrides-page',
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
  templateUrl: './branch-configuration-overrides.page.html',
  styleUrl: './branch-configuration-overrides.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchConfigurationOverridesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BranchConfigurationOverridesApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';
  readonly versions = signal<readonly BranchConfigurationOverrideListItem[]>([]);
  readonly baseConfigurations = signal<readonly OrganizationConfigurationListItem[]>([]);
  readonly selected = signal<BranchConfigurationOverride | null>(null);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly mode = signal<'view' | 'create' | 'edit' | 'publish' | 'archive'>('view');
  readonly jsonError = signal<string | null>(null);

  readonly publishedBaseConfigurations = computed(() =>
    this.baseConfigurations().filter((x) => x.status === OrganizationConfigurationStatus.Published),
  );
  readonly canCreate = computed(() => this.authorization.hasPermission(permissions.create));
  readonly canUpdate = computed(() => this.authorization.hasPermission(permissions.update));
  readonly canPublish = computed(() => this.authorization.hasPermission(permissions.publish));
  readonly canArchive = computed(() => this.authorization.hasPermission(permissions.archive));

  readonly createForm = this.fb.nonNullable.group({
    baseConfigurationId: ['', Validators.required],
    versionNumber: [1, [Validators.required, Validators.min(1)]],
    countryCode: ['FR', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    payloadJson: ['{}', Validators.required],
  });
  readonly editForm = this.fb.nonNullable.group({ payloadJson: ['', Validators.required] });
  readonly publishForm = this.fb.nonNullable.group({
    effectiveFromUtc: [this.toLocalInput(new Date()), Validators.required],
    effectiveToUtc: [''],
  });

  constructor() {
    if (!this.organizationId || !this.branchId) {
      void this.router.navigate(['/organizations']);
      return;
    }
    this.loadInitialData();
  }

  select(item: BranchConfigurationOverrideListItem): void {
    if (this.saving()) return;
    this.mode.set('view');
    this.detailLoading.set(true);
    this.api
      .getById(this.organizationId, this.branchId, item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (value) => {
          this.selected.set(value);
          this.detailLoading.set(false);
          this.jsonError.set(null);
        },
        error: (error) => {
          this.detailLoading.set(false);
          this.showErrors(error);
        },
      });
  }

  openCreate(): void {
    const nextVersion = Math.max(0, ...this.versions().map((x) => x.versionNumber)) + 1;
    const base = this.publishedBaseConfigurations()[0] ?? null;
    this.createForm.reset({
      baseConfigurationId: base?.id ?? '',
      versionNumber: nextVersion,
      countryCode: base?.countryCode ?? 'FR',
      payloadJson: '{}',
    });
    this.jsonError.set(null);
    this.mode.set('create');
  }

  onBaseConfigurationChanged(): void {
    const id = this.createForm.controls.baseConfigurationId.value;
    const base = this.publishedBaseConfigurations().find((x) => x.id === id);
    if (base) this.createForm.controls.countryCode.setValue(base.countryCode);
  }

  openEdit(): void {
    const current = this.selected();
    if (!current || current.status !== BranchConfigurationOverrideStatus.Draft || !this.canUpdate())
      return;
    this.editForm.reset({ payloadJson: this.prettyJson(current.payloadJson) });
    this.jsonError.set(null);
    this.mode.set('edit');
  }

  openPublish(): void {
    const current = this.selected();
    if (
      !current ||
      current.status !== BranchConfigurationOverrideStatus.Draft ||
      !this.canPublish()
    )
      return;
    this.publishForm.reset({ effectiveFromUtc: this.toLocalInput(new Date()), effectiveToUtc: '' });
    this.mode.set('publish');
  }

  openArchive(): void {
    const current = this.selected();
    if (
      !current ||
      current.status !== BranchConfigurationOverrideStatus.Published ||
      !this.canArchive()
    )
      return;
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
    this.api
      .createDraft(this.organizationId, this.branchId, {
        baseConfigurationId: value.baseConfigurationId,
        versionNumber: value.versionNumber,
        countryCode: value.countryCode.trim().toUpperCase(),
        payloadJson,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.afterMutation(result.id),
        error: (error) => this.onMutationError(error),
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
    this.api
      .updateDraft(this.organizationId, this.branchId, current.id, {
        payloadJson,
        expectedRevision: current.revision,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.afterMutation(current.id),
        error: (error) => this.onMutationError(error),
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
        this.translate.instant(
          'organizations.branchConfigurationOverrides.validation.invalidPeriod',
        ),
      );
      return;
    }
    this.saving.set(true);
    this.api
      .publish(this.organizationId, this.branchId, current.id, {
        effectiveFromUtc: from,
        effectiveToUtc: to,
        expectedRevision: current.revision,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.afterMutation(current.id),
        error: (error) => this.onMutationError(error),
      });
  }

  submitArchive(): void {
    const current = this.selected();
    if (!current || this.saving()) return;
    this.saving.set(true);
    this.api
      .archive(this.organizationId, this.branchId, current.id, {
        expectedRevision: current.revision,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.afterMutation(current.id),
        error: (error) => this.onMutationError(error),
      });
  }

  statusLabel(status: BranchConfigurationOverrideStatus): string {
    return `organizations.branchConfigurationOverrides.status.${BranchConfigurationOverrideStatus[status]}`;
  }
  statusVariant(status: BranchConfigurationOverrideStatus): 'neutral' | 'info' | 'success' {
    return status === BranchConfigurationOverrideStatus.Draft
      ? 'info'
      : status === BranchConfigurationOverrideStatus.Published
        ? 'success'
        : 'neutral';
  }
  isSelected(id: string): boolean {
    return this.selected()?.id === id;
  }
  baseVersionLabel(id: string): string {
    const item = this.baseConfigurations().find((x) => x.id === id);
    return item ? `v${item.versionNumber} · ${item.countryCode}` : id;
  }

  private loadInitialData(): void {
    this.loading.set(true);
    forkJoin({
      versions: this.api.getVersions(this.organizationId, this.branchId),
      bases: this.api.getOrganizationConfigurations(this.organizationId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.versions.set(result.versions);
          this.baseConfigurations.set(result.bases);
          this.loading.set(false);
          if (result.versions.length > 0) this.select(result.versions[0]);
        },
        error: (error) => {
          this.loading.set(false);
          this.showErrors(error);
        },
      });
  }

  private loadVersions(preferredId?: string): void {
    this.api
      .getVersions(this.organizationId, this.branchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.versions.set(items);
          const target = items.find((x) => x.id === preferredId) ?? items[0];
          if (target) this.select(target);
          else {
            this.selected.set(null);
            this.mode.set('view');
          }
        },
        error: (error) => this.showErrors(error),
      });
  }

  private afterMutation(id: string): void {
    this.saving.set(false);
    this.mode.set('view');
    this.toast.success(
      this.translate.instant('organizations.branchConfigurationOverrides.notifications.saved'),
    );
    this.loadVersions(id);
  }
  private onMutationError(error: HttpErrorResponse): void {
    this.saving.set(false);
    if (error.status === 409) {
      this.toast.warning(
        this.translate.instant('organizations.branchConfigurationOverrides.conflict.title'),
        this.translate.instant('organizations.branchConfigurationOverrides.conflict.description'),
      );
      this.loadVersions(this.selected()?.id);
      return;
    }
    this.showErrors(error);
  }
  private normalizeJson(value: string): string | null {
    try {
      const parsed: unknown = JSON.parse(value);
      if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
      this.jsonError.set(null);
      return JSON.stringify(parsed);
    } catch {
      this.jsonError.set(
        this.translate.instant('organizations.branchConfigurationOverrides.validation.invalidJson'),
      );
      return null;
    }
  }
  private prettyJson(value: string): string {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  private toUtc(value: string): string | null {
    return value ? new Date(value).toISOString() : null;
  }
  private toLocalInput(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
  }
  private showErrors(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error))
      this.toast.error(this.translate.instant('errors.title'), message);
  }
}
