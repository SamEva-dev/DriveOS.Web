import {
  canApplyOrganizationLifecycleAction,
  getOrganizationLifecycleActions,
} from './organization-lifecycle';

describe('organization lifecycle', () => {
  it('should allow submission from Draft', () => {
    const actions = getOrganizationLifecycleActions('Draft');

    expect(actions.map((action) => action.code)).toEqual(['submitForActivation']);
  });

  it('should allow activation from PendingActivation', () => {
    const actions = getOrganizationLifecycleActions('PendingActivation');

    expect(actions.map((action) => action.code)).toEqual(['activate']);
  });

  it('should expose operational actions from Active', () => {
    const actions = getOrganizationLifecycleActions('Active');

    expect(actions.map((action) => action.code)).toEqual(['restrict', 'suspend', 'close']);
  });

  it('should allow reactivation from Restricted', () => {
    expect(canApplyOrganizationLifecycleAction('Restricted', 'reactivate')).toBe(true);
  });

  it('should reject direct activation from Draft', () => {
    expect(canApplyOrganizationLifecycleAction('Draft', 'activate')).toBe(false);
  });

  it('should expose no action from Closed', () => {
    expect(getOrganizationLifecycleActions('Closed')).toEqual([]);
  });

  it('should expose no action from Archived', () => {
    expect(getOrganizationLifecycleActions('Archived')).toEqual([]);
  });
});
