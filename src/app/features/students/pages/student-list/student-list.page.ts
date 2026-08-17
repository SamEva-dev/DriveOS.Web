import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { StudentsApiService } from '../../data-access/students-api.service';
import { PagedStudents, StudentSortField } from '../../models/student.models';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import {
  DriveOsPaginatorComponent,
  DriveOsPageChange,
} from '../../../../shared/ui/paginator/driveos-paginator.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
} from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsTableDirective } from '../../../../shared/ui/table/driveos-table.directive';

@Component({
  selector: 'driveos-student-list-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsInputDirective,
    DriveOsPaginatorComponent,
    DriveOsSpinnerComponent,
    DriveOsBadgeComponent,
    DriveOsEmptyStateComponent,
    DriveOsTableDirective,
  ],
  templateUrl: './student-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentListPage {
  private readonly api = inject(StudentsApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly page = signal<PagedStudents>({
    items: [],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly sortBy = signal<StudentSortField>('Name');
  readonly descending = signal(false);
  constructor() {
    this.search.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    this.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(1));
    this.load();
  }
  load(pageNumber = this.page().pageNumber, pageSize = this.page().pageSize): void {
    this.loading.set(true);
    this.error.set(false);
    this.api
      .getStudents({
        pageNumber,
        pageSize,
        search: this.search.value,
        status: this.status.value || undefined,
        sortBy: this.sortBy(),
        sortDirection: this.descending() ? 'Descending' : 'Ascending',
      })
      .subscribe({
        next: (page) => {
          this.page.set(page);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
  pageChange(event: DriveOsPageChange): void {
    this.load(event.pageNumber, event.pageSize);
  }
  open(id: string): void {
    void this.router.navigate(['/students', id]);
  }
  sort(field: StudentSortField): void {
    if (this.sortBy() === field) this.descending.update((v) => !v);
    else {
      this.sortBy.set(field);
      this.descending.set(false);
    }
    this.load(1);
  }
  badge(status: string): DriveOsBadgeVariant {
    return status === 'Active' ? 'success' : status === 'Archived' ? 'neutral' : 'warning';
  }
}
