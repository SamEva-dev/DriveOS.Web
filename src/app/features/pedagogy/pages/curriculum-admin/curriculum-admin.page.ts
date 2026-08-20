import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { PEDAGOGY_PERMISSIONS } from '../../domain/pedagogy-permissions';
import { PedagogyApiService } from '../../data-access/pedagogy-api.service';
import {
  CurriculumDetail,
  CurriculumListItem,
  LicenseCategoryListItem,
} from '../../models/curriculum.models';
type Tab = 'overview' | 'modules' | 'competencies' | 'versions' | 'publication';
@Component({
  selector: 'driveos-curriculum-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, DriveOsInputDirective],
  templateUrl: './curriculum-admin.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurriculumAdminPage {
  private readonly api = inject(PedagogyApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly fb = inject(FormBuilder);
  readonly items = signal<CurriculumListItem[]>([]);
  readonly categories = signal<LicenseCategoryListItem[]>([]);
  readonly selected = signal<CurriculumDetail | null>(null);
  readonly tab = signal<Tab>('overview');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly canManage = computed(() =>
    this.auth.hasPermission(PEDAGOGY_PERMISSIONS.curricula.manage),
  );
  readonly canPublish = computed(() =>
    this.auth.hasPermission(PEDAGOGY_PERMISSIONS.curricula.publish),
  );
  readonly draftVersion = computed(
    () => this.selected()?.versions.find((v) => v.status === 'Draft') ?? null,
  );
  readonly selectedVersionId = signal<string>('');
  readonly categoryForm = this.fb.nonNullable.group({
    countryCode: ['FR', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    code: ['B', Validators.required],
    name: ['Permis B', Validators.required],
    description: [''],
  });
  readonly curriculumForm = this.fb.nonNullable.group({
    code: ['FR-B', Validators.required],
    name: ['Référentiel permis B', Validators.required],
    description: [''],
    countryCode: ['FR', Validators.required],
    licenseCategoryCode: ['B', Validators.required],
  });
  readonly versionForm = this.fb.nonNullable.group({
    effectiveFrom: [new Date().toISOString().slice(0, 10), Validators.required],
    effectiveTo: [''],
    changeSummary: [''],
  });
  readonly moduleForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    order: [1, [Validators.required, Validators.min(1)]],
  });
  readonly competencyForm = this.fb.nonNullable.group({
    moduleId: ['', Validators.required],
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    learningObjective: ['', Validators.required],
    order: [1, [Validators.required, Validators.min(1)]],
    isRequired: [true],
  });
  constructor() {
    this.reload();
  }
  setTab(t: Tab) {
    this.tab.set(t);
  }
  select(id: string) {
    this.busy.set(true);
    this.api
      .getCurriculum(id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (x) => {
          this.selected.set(x);
          this.selectedVersionId.set(x.versions[0]?.id ?? '');
        },
        error: () => this.error.set('pedagogy.curricula.errors.load'),
      });
  }
  reload() {
    this.error.set(null);
    this.api.listCurricula().subscribe({
      next: (x) => {
        this.items.set(x);
        if (!this.selected() && x.length) this.select(x[0].id);
      },
      error: () => this.error.set('pedagogy.curricula.errors.load'),
    });
    this.api.listLicenseCategories().subscribe({ next: (x) => this.categories.set(x) });
  }
  createCategory() {
    if (this.categoryForm.invalid) return;
    this.busy.set(true);
    const v = this.categoryForm.getRawValue();
    this.api
      .createLicenseCategory({ ...v, description: v.description || null })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => this.api.activateLicenseCategory(r.id).subscribe(() => this.reload()),
        error: () => this.error.set('pedagogy.curricula.errors.save'),
      });
  }
  createCurriculum() {
    if (this.curriculumForm.invalid) return;
    this.busy.set(true);
    const v = this.curriculumForm.getRawValue();
    this.api
      .createCurriculum({ ...v, description: v.description || null })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => {
          this.reload();
          this.select(r.id);
        },
        error: () => this.error.set('pedagogy.curricula.errors.save'),
      });
  }
  createVersion() {
    const c = this.selected();
    if (!c || this.versionForm.invalid) return;
    const v = this.versionForm.getRawValue();
    this.busy.set(true);
    this.api
      .createVersion(c.id, {
        effectiveFrom: v.effectiveFrom,
        effectiveTo: v.effectiveTo || null,
        changeSummary: v.changeSummary || null,
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => this.select(c.id),
        error: () => this.error.set('pedagogy.curricula.errors.save'),
      });
  }
  addModule() {
    const c = this.selected(),
      v = this.draftVersion();
    if (!c || !v || this.moduleForm.invalid) return;
    const x = this.moduleForm.getRawValue();
    this.busy.set(true);
    this.api
      .addModule(c.id, v.id, { ...x, description: x.description || null })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.moduleForm.patchValue({ code: '', name: '', description: '', order: x.order + 1 });
          this.select(c.id);
        },
        error: () => this.error.set('pedagogy.curricula.errors.save'),
      });
  }
  addCompetency() {
    const c = this.selected(),
      v = this.draftVersion();
    if (!c || !v || this.competencyForm.invalid) return;
    const x = this.competencyForm.getRawValue();
    this.busy.set(true);
    this.api
      .addCompetency(c.id, v.id, x.moduleId, {
        code: x.code,
        name: x.name,
        description: x.description || null,
        learningObjective: x.learningObjective,
        order: x.order,
        isRequired: x.isRequired,
      })
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => {
          this.competencyForm.patchValue({
            code: '',
            name: '',
            description: '',
            learningObjective: '',
            order: x.order + 1,
          });
          this.select(c.id);
        },
        error: () => this.error.set('pedagogy.curricula.errors.save'),
      });
  }
  publish() {
    const c = this.selected(),
      v = this.draftVersion();
    if (!c || !v) return;
    this.busy.set(true);
    this.api
      .publishVersion(c.id, v.id)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () => this.select(c.id),
        error: () => this.error.set('pedagogy.curricula.errors.publish'),
      });
  }
}
