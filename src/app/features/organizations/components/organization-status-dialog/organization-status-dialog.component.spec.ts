import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { provideTranslateService } from '@ngx-translate/core';

import { OrganizationStatusDialogComponent } from './organization-status-dialog.component';

describe('OrganizationStatusDialogComponent', () => {
  let fixture: ComponentFixture<OrganizationStatusDialogComponent>;

  let component: OrganizationStatusDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationStatusDialogComponent],
      providers: [
        provideNoopAnimations(),
        provideTranslateService({
          fallbackLang: 'fr',
          lang: 'fr',
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationStatusDialogComponent);

    component = fixture.componentInstance;

    fixture.componentRef.setInput('organizationName', 'Auto-école Horizon');

    fixture.componentRef.setInput('action', {
      code: 'suspend',
      labelKey: 'organizations.lifecycle.actions.suspend.label',
      titleKey: 'organizations.lifecycle.actions.suspend.title',
      descriptionKey: 'organizations.lifecycle.actions.suspend.description',
      icon: 'ph-bold ph-pause-circle',
      buttonVariant: 'danger',
    });

    fixture.componentRef.setInput('open', true);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reject an empty reason', () => {
    let emittedReason: string | undefined;

    component.confirmed.subscribe((reason) => (emittedReason = reason));

    component.reasonControl.setValue('');

    component.submit();

    expect(emittedReason).toBeUndefined();

    expect(component.reasonControl.invalid).toBe(true);
  });

  it('should reject a whitespace-only reason', () => {
    component.reasonControl.setValue('   ');

    component.submit();

    expect(component.reasonControl.invalid).toBe(true);

    expect(component.reasonControl.hasError('blank')).toBe(true);
  });

  it('should emit a trimmed reason', () => {
    let emittedReason: string | undefined;

    component.confirmed.subscribe((reason) => (emittedReason = reason));

    component.reasonControl.setValue('  Document expiré.  ');

    component.submit();

    expect(emittedReason).toBe('Document expiré.');
  });

  it('should not close while submitting', () => {
    let cancelled = false;

    component.cancelled.subscribe(() => (cancelled = true));

    fixture.componentRef.setInput('submitting', true);

    fixture.detectChanges();

    component.close();

    expect(cancelled).toBe(false);
  });

  it('should emit cancellation when Escape is pressed', () => {
    let cancelled = false;

    component.cancelled.subscribe(() => (cancelled = true));

    component.onEscape();

    expect(cancelled).toBe(true);
  });
});
