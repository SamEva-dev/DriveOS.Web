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
  DriveOsInputDirective,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';
import {
  OrganizationSubscriptionsApiService,
  OrganizationSubscriptionStatusAction,
} from '../../data-access/organization-subscriptions-api.service';
import { ORGANIZATION_SUBSCRIPTION_PERMISSIONS as permissions } from '../../domain/organization-subscription-permissions';
import {
  OrganizationSubscription,
  OrganizationSubscriptionBillingCycle,
  OrganizationSubscriptionStatus,
} from '../../models/organization-subscription.model';

@Component({
  selector: 'driveos-organization-subscription-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './organization-subscription.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSubscriptionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OrganizationSubscriptionsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly subscription = signal<OrganizationSubscription | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly notFound = signal(false);
  readonly showCreate = signal(false);
  readonly showPlan = signal(false);
  readonly selectedStatusAction = signal<OrganizationSubscriptionStatusAction | null>(null);
  readonly showCancel = signal(false);

  readonly canCreate = computed(() => this.authorization.hasPermission(permissions.create));
  readonly canChangePlan = computed(() => this.authorization.hasPermission(permissions.changePlan));
  readonly canCancel = computed(() => this.authorization.hasPermission(permissions.cancel));

  readonly createForm = this.fb.nonNullable.group({
    planCode: ['Starter', [Validators.required, Validators.maxLength(64)]],
    status: [OrganizationSubscriptionStatus.Trialing, Validators.required],
    billingCycle: [OrganizationSubscriptionBillingCycle.Monthly, Validators.required],
    currentPeriodStartsAtUtc: [this.toLocalInput(new Date()), Validators.required],
    currentPeriodEndsAtUtc: [''],
    trialStartsAtUtc: [this.toLocalInput(new Date())],
    trialEndsAtUtc: [this.toLocalInput(new Date(Date.now() + 14 * 86400000))],
    externalProvider: [''],
    externalSubscriptionId: [''],
  });

  readonly planForm = this.fb.nonNullable.group({
    planCode: ['', [Validators.required, Validators.maxLength(64)]],
    entitlementCodes: [''],
    limits: [''],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  readonly statusForm = this.fb.nonNullable.group({
    periodStartsAtUtc: [''],
    periodEndsAtUtc: [''],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  readonly cancelForm = this.fb.nonNullable.group({
    effectiveAtUtc: [this.toLocalInput(new Date()), Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });

  constructor() {
    if (!this.organizationId) {
      void this.router.navigate(['/organizations']);
      return;
    }
    this.load();
  }

  statusLabel(status: OrganizationSubscriptionStatus): string {
    return `organizations.subscription.status.${OrganizationSubscriptionStatus[status]}`;
  }

  billingCycleLabel(cycle: OrganizationSubscriptionBillingCycle): string {
    return `organizations.subscription.billingCycle.${OrganizationSubscriptionBillingCycle[cycle]}`;
  }

  statusVariant(
    status: OrganizationSubscriptionStatus,
  ): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
    switch (status) {
      case OrganizationSubscriptionStatus.Active:
        return 'success';
      case OrganizationSubscriptionStatus.Trialing:
        return 'info';
      case OrganizationSubscriptionStatus.PastDue:
      case OrganizationSubscriptionStatus.Restricted:
        return 'warning';
      case OrganizationSubscriptionStatus.Suspended:
      case OrganizationSubscriptionStatus.Cancelled:
      case OrganizationSubscriptionStatus.Expired:
        return 'danger';
    }
  }

  canRun(action: OrganizationSubscriptionStatusAction): boolean {
    const map: Record<OrganizationSubscriptionStatusAction, string> = {
      activate: permissions.activate,
      'mark-past-due': permissions.markPastDue,
      restrict: permissions.restrict,
      suspend: permissions.suspend,
      expire: permissions.expire,
    };
    return this.authorization.hasPermission(map[action]);
  }

  openCreate(): void {
    this.showCreate.set(true);
  }
  closeCreate(): void {
    if (!this.saving()) this.showCreate.set(false);
  }

  openPlan(): void {
    const value = this.subscription();
    if (!value) return;
    this.planForm.reset({
      planCode: value.planCode,
      entitlementCodes: value.entitlements.map((x) => x.code).join('\n'),
      limits: value.limits.map((x) => `${x.code}=${x.value}`).join('\n'),
      reason: '',
    });
    this.showPlan.set(true);
  }

  openStatus(action: OrganizationSubscriptionStatusAction): void {
    if (!this.canRun(action)) return;
    this.statusForm.reset({ periodStartsAtUtc: '', periodEndsAtUtc: '', reason: '' });
    this.selectedStatusAction.set(action);
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.saving()) {
      this.createForm.markAllAsTouched();
      return;
    }
    const value = this.createForm.getRawValue();
    this.saving.set(true);
    this.api
      .create(this.organizationId, {
        planCode: value.planCode.trim(),
        status: value.status,
        billingCycle: value.billingCycle,
        currentPeriodStartsAtUtc: this.toUtc(value.currentPeriodStartsAtUtc)!,
        currentPeriodEndsAtUtc: this.toUtc(value.currentPeriodEndsAtUtc),
        trialStartsAtUtc: this.toUtc(value.trialStartsAtUtc),
        trialEndsAtUtc: this.toUtc(value.trialEndsAtUtc),
        externalProvider: this.nullIfBlank(value.externalProvider),
        externalSubscriptionId: this.nullIfBlank(value.externalSubscriptionId),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.afterSave(), error: (e) => this.onError(e) });
  }

  submitPlan(): void {
    const current = this.subscription();
    if (!current || this.planForm.invalid || this.saving()) {
      this.planForm.markAllAsTouched();
      return;
    }
    let limits: Record<string, number>;
    try {
      limits = this.parseLimits(this.planForm.controls.limits.value);
    } catch {
      this.toast.error(
        this.translate.instant('errors.title'),
        this.translate.instant('organizations.subscription.validation.invalidLimits'),
      );
      return;
    }
    const value = this.planForm.getRawValue();
    this.saving.set(true);
    this.api
      .changePlan(this.organizationId, {
        planCode: value.planCode.trim(),
        entitlementCodes: this.parseLines(value.entitlementCodes),
        limits,
        expectedVersion: current.version,
        reason: value.reason.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.afterSave(), error: (e) => this.onError(e) });
  }

  submitStatus(): void {
    const current = this.subscription();
    const action = this.selectedStatusAction();
    if (!current || !action || this.statusForm.invalid || this.saving()) {
      this.statusForm.markAllAsTouched();
      return;
    }
    const value = this.statusForm.getRawValue();
    this.saving.set(true);
    this.api
      .changeStatus(this.organizationId, action, {
        periodStartsAtUtc: this.toUtc(value.periodStartsAtUtc),
        periodEndsAtUtc: this.toUtc(value.periodEndsAtUtc),
        expectedVersion: current.version,
        reason: value.reason.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.afterSave(), error: (e) => this.onError(e) });
  }

  submitCancel(): void {
    const current = this.subscription();
    if (!current || this.cancelForm.invalid || this.saving()) {
      this.cancelForm.markAllAsTouched();
      return;
    }
    const value = this.cancelForm.getRawValue();
    this.saving.set(true);
    this.api
      .cancel(this.organizationId, {
        effectiveAtUtc: this.toUtc(value.effectiveAtUtc)!,
        expectedVersion: current.version,
        reason: value.reason.trim(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => this.afterSave(), error: (e) => this.onError(e) });
  }

  closeDialogs(): void {
    if (this.saving()) return;
    this.showCreate.set(false);
    this.showPlan.set(false);
    this.selectedStatusAction.set(null);
    this.showCancel.set(false);
  }

  private load(): void {
    this.loading.set(true);
    this.api
      .get(this.organizationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (value) => {
          this.subscription.set(value);
          this.notFound.set(false);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          if (error.status === 404) {
            this.notFound.set(true);
            return;
          }
          this.onError(error);
        },
      });
  }

  private afterSave(): void {
    this.saving.set(false);
    this.closeDialogs();
    this.toast.success(this.translate.instant('organizations.subscription.messages.saved'));
    this.load();
  }

  private onError(error: HttpErrorResponse): void {
    this.saving.set(false);
    for (const message of this.apiErrors.getMessages(error)) {
      this.toast.error(this.translate.instant('errors.title'), message);
    }
  }

  private parseLines(value: string): string[] {
    return [
      ...new Set(
        value
          .split(/[,\n]/)
          .map((x) => x.trim())
          .filter(Boolean),
      ),
    ];
  }

  private parseLimits(value: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const line of value
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean)) {
      const separator = line.lastIndexOf('=');
      if (separator <= 0) throw new Error('invalid');
      const code = line.slice(0, separator).trim();
      const amount = Number(line.slice(separator + 1).trim());
      if (!code || !Number.isSafeInteger(amount) || amount < 0 || code in result)
        throw new Error('invalid');
      result[code] = amount;
    }
    return result;
  }

  private toUtc(value: string): string | null {
    return value ? new Date(value).toISOString() : null;
  }

  private toLocalInput(value: Date): string {
    const offset = value.getTimezoneOffset() * 60000;
    return new Date(value.getTime() - offset).toISOString().slice(0, 16);
  }

  private nullIfBlank(value: string): string | null {
    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }
}
