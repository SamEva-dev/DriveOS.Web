import { AuthUser } from './auth-user.model';

export interface AuthUsersPage {
  readonly items: readonly AuthUser[];

  readonly totalCount: number;

  readonly page: number;

  readonly pageSize: number;

  readonly totalPages: number;

  readonly hasPreviousPage: boolean;

  readonly hasNextPage: boolean;
}
