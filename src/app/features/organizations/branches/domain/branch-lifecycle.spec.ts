import {
  getBranchLifecycleActions,
} from './branch-lifecycle';

describe(
  'getBranchLifecycleActions',
  () => {
    it(
      'should allow activation from Draft',
      () => {
        const actions =
          getBranchLifecycleActions(
            'Draft',
          );

        expect(
          actions.map(
            action => action.code,
          ),
        ).toEqual([
          'activate',
        ]);
      },
    );

    it(
      'should expose restrict, suspend and close from Active',
      () => {
        const actions =
          getBranchLifecycleActions(
            'Active',
          );

        expect(
          actions.map(
            action => action.code,
          ),
        ).toEqual([
          'restrict',
          'suspend',
          'close',
        ]);
      },
    );

    it(
      'should expose reactivate, suspend and close from Restricted',
      () => {
        const actions =
          getBranchLifecycleActions(
            'Restricted',
          );

        expect(
          actions.map(
            action => action.code,
          ),
        ).toEqual([
          'reactivate',
          'suspend',
          'close',
        ]);
      },
    );

    it(
      'should expose reactivate and close from Suspended',
      () => {
        const actions =
          getBranchLifecycleActions(
            'Suspended',
          );

        expect(
          actions.map(
            action => action.code,
          ),
        ).toEqual([
          'reactivate',
          'close',
        ]);
      },
    );

    it(
      'should expose no action from Closed',
      () => {
        const actions =
          getBranchLifecycleActions(
            'Closed',
          );

        expect(actions).toEqual([]);
      },
    );

    it(
      'should define the expected target statuses',
      () => {
        const activeActions =
          getBranchLifecycleActions(
            'Active',
          );

        expect(
          activeActions.find(
            action =>
              action.code ===
              'restrict',
          )?.targetStatus,
        ).toBe('Restricted');

        expect(
          activeActions.find(
            action =>
              action.code ===
              'suspend',
          )?.targetStatus,
        ).toBe('Suspended');

        expect(
          activeActions.find(
            action =>
              action.code ===
              'close',
          )?.targetStatus,
        ).toBe('Closed');
      },
    );
  },
);
