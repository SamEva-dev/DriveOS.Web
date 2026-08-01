import { TestBed } from '@angular/core/testing';

import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(AuthorizationService);
  });

  it('should initially contain no permissions', () => {
    expect(service.hasAnyPermission()).toBeFalse();

    expect(service.hasPermission('Branches.Read')).toBeFalse();
  });

  it('should set permissions', () => {
    service.setPermissions(['Branches.Read', 'Branches.Update']);

    expect(service.hasPermission('Branches.Read')).toBeTrue();

    expect(service.hasPermission('Branches.Update')).toBeTrue();
  });

  it('should support hasAny', () => {
    service.setPermissions(['Branches.Read']);

    expect(service.hasAny(['Branches.Read', 'Branches.Update'])).toBeTrue();
  });

  it('should support hasAll', () => {
    service.setPermissions(['Branches.Read', 'Branches.Update']);

    expect(service.hasAll(['Branches.Read', 'Branches.Update'])).toBeTrue();

    expect(service.hasAll(['Branches.Read', 'Branches.Close'])).toBeFalse();
  });

  it('should clear all permissions', () => {
    service.setPermissions(['Branches.Read']);

    service.clearPermissions();

    expect(service.hasAnyPermission()).toBeFalse();
  });
});
