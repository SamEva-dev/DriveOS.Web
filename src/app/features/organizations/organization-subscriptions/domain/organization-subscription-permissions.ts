export const ORGANIZATION_SUBSCRIPTION_PERMISSIONS = {
  read: 'OrganizationSubscriptions.Read',
  create: 'OrganizationSubscriptions.Create',
  changePlan: 'OrganizationSubscriptions.ChangePlan',
  activate: 'OrganizationSubscriptions.Activate',
  markPastDue: 'OrganizationSubscriptions.MarkPastDue',
  restrict: 'OrganizationSubscriptions.Restrict',
  suspend: 'OrganizationSubscriptions.Suspend',
  cancel: 'OrganizationSubscriptions.Cancel',
  expire: 'OrganizationSubscriptions.Expire',
  readEntitlements: 'OrganizationSubscriptions.Entitlements.Read',
  readLimits: 'OrganizationSubscriptions.Limits.Read',
} as const;
