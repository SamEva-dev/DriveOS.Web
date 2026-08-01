import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideTranslateService } from '@ngx-translate/core';

import { OrganizationStatusHistoryComponent } from './organization-status-history.component';

describe('OrganizationStatusHistoryComponent', () => {
  let fixture: ComponentFixture<OrganizationStatusHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationStatusHistoryComponent],
      providers: [
        provideTranslateService({
          fallbackLang: 'fr',
          lang: 'fr',
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationStatusHistoryComponent);
  });

  it('should display an empty state', () => {
    fixture.componentRef.setInput('history', []);

    fixture.componentRef.setInput('loading', false);

    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;

    expect(content).toContain('organizations.lifecycle.history.emptyTitle');
  });

  it('should display status transitions', () => {
    fixture.componentRef.setInput('history', [
      {
        id: '11111111-1111-1111-1111-111111111111',
        previousStatus: 'Draft',
        newStatus: 'PendingActivation',
        reason: 'Dossier transmis.',
        changedByUserId: '22222222-2222-2222-2222-222222222222',
        changedAtUtc: '2026-07-29T08:00:00Z',
      },
    ]);

    fixture.componentRef.setInput('loading', false);

    fixture.detectChanges();

    const content = fixture.nativeElement.textContent;

    expect(content).toContain('Dossier transmis.');

    expect(content).toContain('22222222-2222-2222-2222-222222222222');
  });
});
