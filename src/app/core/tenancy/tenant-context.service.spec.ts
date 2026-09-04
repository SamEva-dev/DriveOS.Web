import { TenantContextService } from './tenant-context.service';

describe('TenantContextService', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('clears the selected branch when the organization changes', () => {
    const service = new TenantContextService();
    service.setOrganization('organization-a');
    service.setBranch('branch-a');

    service.setOrganization('organization-b');

    expect(service.organizationId()).toBe('organization-b');
    expect(service.branchId()).toBeNull();
  });
});
