import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { AuthUsersApiService } from '../../../core/auth/data-access/auth-users-api.service';
import { AuthUser, authUserDisplayName } from '../../../core/auth/models/auth-user.model';
import { ApiErrorService } from '../../../core/errors/api-error.service';
import { DriveOsBadgeComponent } from '../badge/driveos-badge.component';
import { DriveOsButtonComponent } from '../button/driveos-button.component';
import { DriveOsEmptyStateComponent } from '../empty-state/driveos-empty-state.component';
import { DriveOsInputDirective } from '../input/driveos-input.directive';
import { DriveOsSpinnerComponent } from '../spinner/driveos-spinner.component';

@Component({
  selector: 'drive-os-auth-user-picker',
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
  templateUrl: './driveos-auth-user-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsAuthUserPickerComponent implements OnChanges {
  private readonly api = inject(AuthUsersApiService);
  private readonly errors = inject(ApiErrorService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) organizationId = '';
  @Input() selectedUserId: string | null = null;
  @Input() disabled = false;
  @Input() required = true;

  @Output() readonly userSelected = new EventEmitter<AuthUser | null>();

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly users = signal<readonly AuthUser[]>([]);
  readonly selectedUser = signal<AuthUser | null>(null);
  readonly loading = signal(false);
  readonly errorMessages = signal<readonly string[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled']) {
      this.disabled
        ? this.searchControl.disable({ emitEvent: false })
        : this.searchControl.enable({ emitEvent: false });
    }

    if (changes['organizationId'] && this.organizationId) {
      this.load(1);
    }

    if (changes['selectedUserId']) {
      this.hydrateSelectedUser();
    }
  }

  choose(user: AuthUser): void {
    if (this.disabled || !user.isActive) return;
    this.selectedUser.set(user);
    this.userSelected.emit(user);
  }

  clear(): void {
    if (this.disabled) return;
    this.selectedUser.set(null);
    this.userSelected.emit(null);
  }

  loadMore(): void {
    if (this.page() >= this.totalPages() || this.loading()) return;
    this.load(this.page() + 1, true);
  }

  displayName(user: AuthUser): string {
    return authUserDisplayName(user);
  }

  private load(page: number, append = false): void {
    if (!this.organizationId) return;

    this.loading.set(true);
    this.errorMessages.set([]);

    this.api
      .getUsers({
        page,
        pageSize: 20,
        search: this.searchControl.value,
        isActive: true,
        role: null,
        organizationId: this.organizationId,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.users.set(append ? [...this.users(), ...result.items] : result.items);
          this.page.set(result.page);
          this.totalPages.set(result.totalPages);
        },
        error: (error) => {
          if (!append) this.users.set([]);
          this.errorMessages.set(this.errors.getMessages(error));
        },
      });
  }

  private hydrateSelectedUser(): void {
    if (!this.selectedUserId) {
      this.selectedUser.set(null);
      return;
    }

    const existing = this.users().find((user) => user.id === this.selectedUserId);
    if (existing) {
      this.selectedUser.set(existing);
      return;
    }

    this.api
      .getById(this.selectedUserId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => this.selectedUser.set(user),
        error: () => this.selectedUser.set(null),
      });
  }
}
