import {
  provideHttpClient,
} from '@angular/common/http';

import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import {
  TestBed,
} from '@angular/core/testing';

import {
  API_CONFIG,
} from '../../../../core/config/api-config';

import {
  BranchType,
} from '../models/branch-type';

import {
  BranchesApiService,
} from './branches-api.service';

describe(
  'BranchesApiService',
  () => {
    let service:
      BranchesApiService;

    let httpTesting:
      HttpTestingController;

    const organizationId =
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    const branchId =
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    const baseUrl =
      `https://api.driveos.test/api/organizations/${organizationId}/branches`;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),

          {
            provide: API_CONFIG,
            useValue: {
              baseUrl:
                'https://api.driveos.test/api',
            },
          },
        ],
      });

      service =
        TestBed.inject(
          BranchesApiService,
        );

      httpTesting =
        TestBed.inject(
          HttpTestingController,
        );
    });

    afterEach(() => {
      httpTesting.verify();
    });

    it(
      'should request a paged branch list',
      () => {
        service
          .getPaged(
            organizationId,
            {
              pageNumber: 2,
              pageSize: 20,
              search: 'Nice',
              sortBy: 'name',
              sortDirection: 'asc',
            },
          )
          .subscribe();

        const request =
          httpTesting.expectOne(
            candidate =>
              candidate.url ===
                baseUrl &&
              candidate.params.get(
                'pageNumber',
              ) === '2' &&
              candidate.params.get(
                'pageSize',
              ) === '20' &&
              candidate.params.get(
                'search',
              ) === 'Nice' &&
              candidate.params.get(
                'sortBy',
              ) === 'name' &&
              candidate.params.get(
                'sortDirection',
              ) === 'asc',
          );

        expect(
          request.request.method,
        ).toBe('GET');

        request.flush({
          items: [],
          pageNumber: 2,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: true,
          hasNextPage: false,
        });
      },
    );

    it(
      'should not send an empty search parameter',
      () => {
        service
          .getPaged(
            organizationId,
            {
              pageNumber: 1,
              pageSize: 20,
              search: '   ',
              sortBy: 'name',
              sortDirection: 'asc',
            },
          )
          .subscribe();

        const request =
          httpTesting.expectOne(
            candidate =>
              candidate.url ===
              baseUrl,
          );

        expect(
          request.request.params.has(
            'search',
          ),
        ).toBeFalse();

        request.flush({
          items: [],
          pageNumber: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        });
      },
    );

    it(
      'should request branch details',
      () => {
        service
          .getById(
            organizationId,
            branchId,
          )
          .subscribe();

        const request =
          httpTesting.expectOne(
            `${baseUrl}/${branchId}`,
          );

        expect(
          request.request.method,
        ).toBe('GET');

        request.flush({
          id: branchId,
          organizationId,
          name: 'Nice Centre',
          code: 'NICE-CENTRE',
          branchType:
            'DrivingSchoolAgency',
          status: 'Draft',
          isPrimary: true,
          addressLine1:
            '10 rue de France',
          addressLine2: null,
          postalCode: '06000',
          city: 'Nice',
          countryCode: 'FR',
          timeZoneId:
            'Europe/Paris',
          createdAtUtc:
            '2026-07-29T10:00:00Z',
          lastModifiedAtUtc: null,
        });
      },
    );

    it(
      'should create a branch',
      () => {
        const requestBody = {
          name:
            'Nice Centre',

          code:
            'NICE-CENTRE',

          branchType:
            BranchType
              .DrivingSchoolAgency,

          addressLine1:
            '10 rue de France',

          addressLine2:
            null,

          postalCode:
            '06000',

          city:
            'Nice',

          timeZoneId:
            'Europe/Paris',

          isPrimary:
            true,
        };

        service
          .create(
            organizationId,
            requestBody,
          )
          .subscribe();

        const request =
          httpTesting.expectOne(
            baseUrl,
          );

        expect(
          request.request.method,
        ).toBe('POST');

        expect(
          request.request.body,
        ).toEqual(requestBody);

        request.flush({
          id: branchId,
        });
      },
    );

    it(
      'should update a branch without sending code or isPrimary',
      () => {
        const requestBody = {
          name:
            'Nice Gambetta',

          branchType:
            BranchType
              .DrivingSchoolAgency,

          addressLine1:
            '20 boulevard Gambetta',

          addressLine2:
            null,

          postalCode:
            '06000',

          city:
            'Nice',

          timeZoneId:
            'Europe/Paris',
        };

        service
          .update(
            organizationId,
            branchId,
            requestBody,
          )
          .subscribe();

        const request =
          httpTesting.expectOne(
            `${baseUrl}/${branchId}`,
          );

        expect(
          request.request.method,
        ).toBe('PUT');

        expect(
          request.request.body,
        ).toEqual(requestBody);

        expect(
          request.request.body.code,
        ).toBeUndefined();

        expect(
          request.request.body
            .isPrimary,
        ).toBeUndefined();

        request.flush(null);
      },
    );

    it(
      'should set a branch as primary',
      () => {
        service
          .setPrimary(
            organizationId,
            branchId,
          )
          .subscribe();

        const request =
          httpTesting.expectOne(
            `${baseUrl}/${branchId}/set-primary`,
          );

        expect(
          request.request.method,
        ).toBe('POST');

        expect(
          request.request.body,
        ).toBeNull();

        request.flush(null);
      },
    );

    it(
      'should request status history',
      () => {
        service
          .getStatusHistory(
            organizationId,
            branchId,
          )
          .subscribe();

        const request =
          httpTesting.expectOne(
            `${baseUrl}/${branchId}/status-history`,
          );

        expect(
          request.request.method,
        ).toBe('GET');

        request.flush([]);
      },
    );

    it(
      'should activate a branch',
      () => {
        service
          .changeStatus(
            organizationId,
            branchId,
            'activate',
            {
              reason:
                'Agence prête.',
            },
          )
          .subscribe();

        const request =
          httpTesting.expectOne(
            `${baseUrl}/${branchId}/activate`,
          );

        expect(
          request.request.method,
        ).toBe('POST');

        expect(
          request.request.body,
        ).toEqual({
          reason:
            'Agence prête.',
        });

        request.flush(null);
      },
    );

    it(
      'should call every lifecycle endpoint',
      () => {
        const actions = [
          'restrict',
          'suspend',
          'reactivate',
          'close',
        ] as const;

        for (const action of actions) {
          service
            .changeStatus(
              organizationId,
              branchId,
              action,
              {
                reason:
                  `Reason ${action}`,
              },
            )
            .subscribe();

          const request =
            httpTesting.expectOne(
              `${baseUrl}/${branchId}/${action}`,
            );

          expect(
            request.request.method,
          ).toBe('POST');

          request.flush(null);
        }
      },
    );
  },
);
