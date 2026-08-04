import {
  OrganizationSubscriptionBillingCycle,
  OrganizationSubscriptionStatus,
} from './organization-subscription.model';

export interface CreateOrganizationSubscriptionRequest {
  readonly planCode: string;
  readonly status: OrganizationSubscriptionStatus;
  readonly billingCycle: OrganizationSubscriptionBillingCycle;
  readonly currentPeriodStartsAtUtc: string;
  readonly currentPeriodEndsAtUtc: string | null;
  readonly trialStartsAtUtc: string | null;
  readonly trialEndsAtUtc: string | null;
  readonly externalProvider: string | null;
  readonly externalSubscriptionId: string | null;
}

export interface ChangeOrganizationSubscriptionPlanRequest {
  readonly planCode: string;
  readonly entitlementCodes: readonly string[];
  readonly limits: Readonly<Record<string, number>>;
  readonly expectedVersion: number;
  readonly reason: string;
}

export interface ChangeOrganizationSubscriptionStatusRequest {
  readonly periodStartsAtUtc: string | null;
  readonly periodEndsAtUtc: string | null;
  readonly expectedVersion: number;
  readonly reason: string;
}

export interface CancelOrganizationSubscriptionRequest {
  readonly effectiveAtUtc: string;
  readonly expectedVersion: number;
  readonly reason: string;
}
