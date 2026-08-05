import { TestBed } from '@angular/core/testing';

import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(AuthorizationService);
  });

  it('should initially contain no permissions', () => {
    expect(service.hasAnyPermission()).toBe(false);

    expect(service.hasPermission('Branches.Read')).toBe(false);
  });

  it('should set permissions', () => {
    service.setPermissions(['Branches.Read', 'Branches.Update']);

    expect(service.hasPermission('Branches.Read')).toBe(true);

    expect(service.hasPermission('Branches.Update')).toBe(true);
  });

  it('should support hasAny', () => {
    service.setPermissions(['Branches.Read']);

    expect(service.hasAny(['Branches.Read', 'Branches.Update'])).toBe(true);
  });

  it('should support hasAll', () => {
    service.setPermissions(['Branches.Read', 'Branches.Update']);

    expect(service.hasAll(['Branches.Read', 'Branches.Update'])).toBe(true);

    expect(service.hasAll(['Branches.Read', 'Branches.Close'])).toBe(false);
  });

  it('should clear all permissions', () => {
    service.setPermissions(['Branches.Read']);

    service.clearPermissions();

    expect(service.hasAnyPermission()).toBe(false);
  });
});
