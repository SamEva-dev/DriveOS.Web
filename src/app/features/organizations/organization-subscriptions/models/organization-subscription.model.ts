export enum OrganizationSubscriptionStatus {
  Trialing = 1,
  Active = 2,
  PastDue = 3,
  Restricted = 4,
  Suspended = 5,
  Cancelled = 6,
  Expired = 7,
}

export enum OrganizationSubscriptionBillingCycle {
  None = 0,
  Monthly = 1,
  Quarterly = 2,
  Yearly = 3,
  Custom = 4,
}

export interface SubscriptionPeriod {
  readonly startsAtUtc: string;
  readonly endsAtUtc: string | null;
}

export interface SubscriptionCancellation {
  readonly requestedAtUtc: string;
  readonly effectiveAtUtc: string;
  readonly reason: string;
  readonly requestedByUserId: string;
}

export interface SubscriptionEntitlement {
  readonly code: string;
}

export interface SubscriptionLimit {
  readonly code: string;
  readonly value: number;
}

export interface OrganizationSubscription {
  readonly id: string;
  readonly organizationId: string;
  readonly planCode: string;
  readonly status: OrganizationSubscriptionStatus;
  readonly billingCycle: OrganizationSubscriptionBillingCycle;
  readonly currentPeriod: SubscriptionPeriod;
  readonly trialPeriod: SubscriptionPeriod | null;
  readonly cancellation: SubscriptionCancellation | null;
  readonly externalProvider: string | null;
  readonly externalSubscriptionId: string | null;
  readonly entitlements: readonly SubscriptionEntitlement[];
  readonly limits: readonly SubscriptionLimit[];
  readonly version: number;
  readonly createdAtUtc: string;
  readonly lastModifiedAtUtc: string | null;
}
