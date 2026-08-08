import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { TranslatePipe } from '@ngx-translate/core';

import { Subject, debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs';

import { AuthUsersApiService } from '../../../../../core/auth/data-access/auth-users-api.service';

import { AuthUser, authUserDisplayName } from '../../../../../core/auth/models/auth-user.model';

import { ApiErrorService } from '../../../../../core/errors/api-error.service';

import {
  DriveOsBadgeComponent,
  DriveOsButtonComponent,
  DriveOsEmptyStateComponent,
  DriveOsInputDirective,
  DriveOsSpinnerComponent,
} from '../../../../../shared/ui';

@Component({
  selector: 'app-auth-user-selector',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
  ],

  templateUrl: './auth-user-selector.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthUserSelectorComponent implements OnInit, OnDestroy {
  private readonly api = inject(AuthUsersApiService);

  private readonly apiError = inject(ApiErrorService);

  private readonly destroy$ = new Subject<void>();

  private organizationIdValue = '';

  readonly users = signal<readonly AuthUser[]>([]);

  readonly loading = signal(false);

  readonly loadingMore = signal(false);

  readonly errorMessages = signal<readonly string[]>([]);

  readonly currentPage = signal(1);

  readonly totalPages = signal(0);

  readonly selectedUser = signal<AuthUser | null>(null);

  readonly searchControl = new FormControl('', {
    nonNullable: true,
  });

  @Input({
    required: true,
  })
  set organizationId(value: string) {
    const changed = value !== this.organizationIdValue;

    this.organizationIdValue = value;

    if (changed && value) {
      this.loadFirstPage();
    }
  }

  private disabledValue = false;

  @Input()
  set disabled(value: boolean) {
    this.disabledValue = value;

    if (value) {
      this.searchControl.disable({ emitEvent: false });
    } else {
      this.searchControl.enable({ emitEvent: false });
    }
  }

  get disabled(): boolean {
    return this.disabledValue;
  }

  @Output()
  readonly userSelected = new EventEmitter<AuthUser | null>();

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadFirstPage();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectUser(user: AuthUser): void {
    if (this.disabled || !user.isActive) {
      return;
    }

    this.selectedUser.set(user);

    this.userSelected.emit(user);
  }

  clearSelection(): void {
    if (this.disabled) {
      return;
    }

    this.selectedUser.set(null);

    this.userSelected.emit(null);
  }

  loadMore(): void {
    if (this.loadingMore() || this.currentPage() >= this.totalPages()) {
      return;
    }

    const nextPage = this.currentPage() + 1;

    this.loadingMore.set(true);

    this.api
      .getUsers({
        page: nextPage,

        pageSize: 20,

        search: this.searchControl.value,

        isActive: true,

        role: null,

        organizationId: this.organizationIdValue,
      })
      .pipe(
        finalize(() => {
          this.loadingMore.set(false);
        }),
      )
      .subscribe({
        next: (page) => {
          this.users.update((current) => [...current, ...page.items]);

          this.currentPage.set(page.page);

          this.totalPages.set(page.totalPages);
        },

        error: (error) => {
          this.errorMessages.set(this.apiError.getMessages(error));
        },
      });
  }

  displayName(user: AuthUser): string {
    return authUserDisplayName(user);
  }

  isSelected(user: AuthUser): boolean {
    return this.selectedUser()?.id === user.id;
  }

  private loadFirstPage(): void {
    if (!this.organizationIdValue) {
      return;
    }

    this.loading.set(true);

    this.errorMessages.set([]);

    this.api
      .getUsers({
        page: 1,

        pageSize: 20,

        search: this.searchControl.value,

        isActive: true,

        role: null,

        organizationId: this.organizationIdValue,
      })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (page) => {
          this.users.set(page.items);

          this.currentPage.set(page.page);

          this.totalPages.set(page.totalPages);

          const selected = this.selectedUser();

          if (selected && !page.items.some((user) => user.id === selected.id)) {
            this.users.update((users) => [selected, ...users]);
          }
        },

        error: (error) => {
          this.users.set([]);

          this.errorMessages.set(this.apiError.getMessages(error));
        },
      });
  }
}
