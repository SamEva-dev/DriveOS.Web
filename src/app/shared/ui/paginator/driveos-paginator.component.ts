import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { TranslatePipe } from '@ngx-translate/core';

import { DriveOsButtonComponent } from '../button/driveos-button.component';

export interface DriveOsPageChange {
  pageNumber: number;
  pageSize: number;
}

@Component({
  selector: 'drive-os-paginator',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsButtonComponent],
  templateUrl: './driveos-paginator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsPaginatorComponent {
  readonly pageNumber = input.required<number>();

  readonly pageSize = input.required<number>();

  readonly totalCount = input.required<number>();

  readonly totalPages = input.required<number>();

  readonly disabled = input(false);

  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);

  readonly pageChange = output<DriveOsPageChange>();

  readonly normalizedPageNumber = computed(() => {
    if (this.totalPages() === 0) {
      return 0;
    }

    return Math.min(Math.max(this.pageNumber(), 1), this.totalPages());
  });

  readonly normalizedTotalPages = computed(() => Math.max(this.totalPages(), 0));

  readonly firstItem = computed(() => {
    if (this.totalCount() === 0) {
      return 0;
    }

    return (this.pageNumber() - 1) * this.pageSize() + 1;
  });

  readonly lastItem = computed(() => {
    if (this.totalCount() === 0) {
      return 0;
    }

    return Math.min(this.pageNumber() * this.pageSize(), this.totalCount());
  });

  goToFirstPage(): void {
    this.emitPageChange(1, this.pageSize());
  }

  goToPreviousPage(): void {
    this.emitPageChange(Math.max(this.pageNumber() - 1, 1), this.pageSize());
  }

  goToNextPage(): void {
    this.emitPageChange(Math.min(this.pageNumber() + 1, this.totalPages()), this.pageSize());
  }

  goToLastPage(): void {
    if (this.totalPages() === 0) {
      return;
    }

    this.emitPageChange(this.totalPages(), this.pageSize());
  }

  changePageSize(pageSize: number): void {
    this.emitPageChange(1, Number(pageSize));
  }

  private emitPageChange(pageNumber: number, pageSize: number): void {
    if (this.disabled()) {
      return;
    }

    this.pageChange.emit({
      pageNumber,
      pageSize,
    });
  }
}
