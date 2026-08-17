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
import {
  DriveOsButtonComponent,
  DriveOsEmptyStateComponent,
  DriveOsInputDirective,
  DriveOsSpinnerComponent,
} from '../../../../shared/ui';
import { LeadsApiService } from '../../data-access/leads-api.service';
import { LeadListItem } from '../../models/lead.model';

@Component({
  selector: 'drive-os-crm-lead-picker',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './crm-lead-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrmLeadPickerComponent implements OnChanges {
  private readonly api = inject(LeadsApiService);
  private readonly destroyRef = inject(DestroyRef);
  @Input() selectedLeadId: string | null = null;
  @Input() disabled = false;
  @Input() required = true;
  @Output() readonly leadSelected = new EventEmitter<LeadListItem | null>();
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly leads = signal<readonly LeadListItem[]>([]);
  readonly selected = signal<LeadListItem | null>(null);
  readonly loading = signal(false);
  readonly failed = signal(false);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'])
      this.disabled
        ? this.searchControl.disable({ emitEvent: false })
        : this.searchControl.enable({ emitEvent: false });
    if (changes['selectedLeadId']) this.hydrate();
  }

  choose(lead: LeadListItem): void {
    if (!this.disabled) {
      this.selected.set(lead);
      this.leadSelected.emit(lead);
    }
  }
  clear(): void {
    if (!this.disabled) {
      this.selected.set(null);
      this.leadSelected.emit(null);
    }
  }
  display(lead: LeadListItem): string {
    return `${lead.firstName} ${lead.lastName}`.trim();
  }

  private load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api
      .search(this.searchControl.value)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => this.leads.set(page.items),
        error: () => {
          this.leads.set([]);
          this.failed.set(true);
        },
      });
  }

  private hydrate(): void {
    if (!this.selectedLeadId) {
      this.selected.set(null);
      return;
    }
    const existing = this.leads().find((x) => x.id === this.selectedLeadId);
    if (existing) {
      this.selected.set(existing);
      return;
    }
    this.api
      .getById(this.selectedLeadId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lead) => this.selected.set(lead),
        error: () => this.selected.set(null),
      });
  }
}
