import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'driveos-auth-shell',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main
      class="min-h-screen bg-gradient-to-br from-white via-white to-blue-50 px-4 py-8 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/40 sm:px-6"
    >
      <div
        class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center gap-6"
      >
        <a
          routerLink="/"
          class="mx-auto flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          <span
            class="flex size-12 items-center justify-center rounded-2xl bg-blue-800 text-white shadow-lg shadow-blue-900/20"
          >
            <i
              class="ph-bold ph-steering-wheel text-2xl"
              aria-hidden="true"
            ></i>
          </span>
          <span class="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Drive
            <span class="text-orange-500">OS</span>
          </span>
        </a>
        <div class="text-center">
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ subtitle() }}</p>
        </div>
        <section
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-7"
        >
          <ng-content />
        </section>
        <p class="text-center text-xs text-slate-400">
          DriveOS · Operating System pour auto-écoles
        </p>
      </div>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShellComponent {
  readonly subtitle = input.required<string>();
}
