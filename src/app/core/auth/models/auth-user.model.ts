export interface AuthUser {
  readonly id: string;

  readonly email: string;

  readonly firstName: string | null;

  readonly lastName: string | null;

  readonly fullName: string | null;

  readonly organizationId: string | null;

  readonly phoneNumber: string | null;

  readonly isActive: boolean;

  readonly mfaEnabled: boolean;

  readonly emailConfirmed: boolean;

  readonly createdAtUtc: string;

  readonly lastLoginAtUtc: string | null;

  readonly roles: readonly string[];
  
  readonly permissions: readonly string[];
}

export function authUserDisplayName(user: AuthUser): string {
  const fullName = [user.firstName, user.lastName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ')
    .trim();

  return fullName || user.email;
}
