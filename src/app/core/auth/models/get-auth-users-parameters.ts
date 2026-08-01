export interface GetAuthUsersParameters {
  readonly page: number;

  readonly pageSize: number;

  readonly search: string;

  readonly isActive: boolean | null;

  readonly role: string | null;

  readonly organizationId: string;
}
