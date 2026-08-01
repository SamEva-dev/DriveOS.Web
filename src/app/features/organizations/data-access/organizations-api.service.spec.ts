import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { provideHttpClient } from '@angular/common/http';

import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../../../core/config/api-config';

import { OrganizationsApiService } from './organizations-api.service';

describe('OrganizationsApiService', () => {
  let service: OrganizationsApiService;

  let httpTesting: HttpTestingController;

  const organizationId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),

        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: 'https://api.driveos.test/api',
          },
        },
      ],
    });

    service = TestBed.inject(OrganizationsApiService);

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should request status history', () => {
    service.getStatusHistory(organizationId).subscribe();

    const request = httpTesting.expectOne(
      `https://api.driveos.test/api/organizations/${organizationId}/status-history`,
    );

    expect(request.request.method).toBe('GET');

    request.flush([]);
  });

  it('should submit organization for activation', () => {
    service
      .changeStatus(organizationId, 'submitForActivation', {
        reason: 'Dossier complet.',
      })
      .subscribe();

    const request = httpTesting.expectOne(
      `https://api.driveos.test/api/organizations/${organizationId}/submit-for-activation`,
    );

    expect(request.request.method).toBe('POST');

    expect(request.request.body).toEqual({
      reason: 'Dossier complet.',
    });

    request.flush(null);
  });

  it('should call suspension endpoint', () => {
    service
      .changeStatus(organizationId, 'suspend', {
        reason: 'Non-conformité.',
      })
      .subscribe();

    const request = httpTesting.expectOne(
      `https://api.driveos.test/api/organizations/${organizationId}/suspend`,
    );

    expect(request.request.method).toBe('POST');

    request.flush(null);
  });

  it('should call reactivation endpoint', () => {
    service
      .changeStatus(organizationId, 'reactivate', {
        reason: 'Conformité rétablie.',
      })
      .subscribe();

    const request = httpTesting.expectOne(
      `https://api.driveos.test/api/organizations/${organizationId}/reactivate`,
    );

    expect(request.request.method).toBe('POST');

    request.flush(null);
  });
});
