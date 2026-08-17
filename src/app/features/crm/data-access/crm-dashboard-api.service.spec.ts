import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../../../core/config/api-config';
import { CrmDashboardApiService } from './crm-dashboard-api.service';

describe('CrmDashboardApiService', () => {
  let service: CrmDashboardApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'https://api.driveos.test/api' } },
      ],
    });
    service = TestBed.inject(CrmDashboardApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends scope, branch and business filters to the server', () => {
    service
      .get('branch', 'branch-id', {
        fromUtc: '2026-08-01T00:00:00.000Z',
        toUtc: '2026-09-01T00:00:00.000Z',
        assignedAdvisorId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        source: 'Website',
        status: 'New',
      })
      .subscribe();

    const request = http.expectOne(
      (candidate) => candidate.url === 'https://api.driveos.test/api/crm/dashboard',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('scope')).toBe('branch');
    expect(request.request.params.get('branchId')).toBe('branch-id');
    expect(request.request.params.get('source')).toBe('Website');
    expect(request.request.params.get('status')).toBe('New');
    expect(request.request.params.get('assignedAdvisorId')).toBe(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    );
    request.flush({});
  });
});
