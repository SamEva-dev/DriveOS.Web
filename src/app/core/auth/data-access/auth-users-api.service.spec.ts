import { provideHttpClient } from '@angular/common/http';

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TestBed } from '@angular/core/testing';

import { AuthUsersApiService } from './auth-users-api.service';

describe('AuthUsersApiService', () => {
  let service: AuthUsersApiService;

  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),

        {
          provide: AUTH_API_CONFIG,

          useValue: {
            baseUrl: '/auth-api',
          },
        },
      ],
    });

    service = TestBed.inject(AuthUsersApiService);

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should search active organization users', () => {
    service
      .getUsers({
        page: 1,

        pageSize: 20,

        search: 'sam',

        isActive: true,

        role: null,

        organizationId: 'organization-1',
      })
      .subscribe();

    const request = http.expectOne((request) => request.url === '/auth-api/users');

    expect(request.request.method).toBe('GET');

    expect(request.request.params.get('page')).toBe('1');

    expect(request.request.params.get('pageSize')).toBe('20');

    expect(request.request.params.get('search')).toBe('sam');

    expect(request.request.params.get('isActive')).toBe('true');

    expect(request.request.params.get('organizationId')).toBe('organization-1');

    request.flush({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    });
  });
});
