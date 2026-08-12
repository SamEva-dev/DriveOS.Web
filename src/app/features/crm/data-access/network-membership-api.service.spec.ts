import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../../../core/config/api-config';
import { NetworkMembershipApiService } from './network-membership-api.service';

describe('NetworkMembershipApiService', () => {
  let service: NetworkMembershipApiService;
  let http: HttpTestingController;
  const endpoint = 'https://api.driveos.test/api/networks/current/members';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'https://api.driveos.test/api' } },
      ],
    });
    service = TestBed.inject(NetworkMembershipApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads members and candidates', () => {
    service.getMembers().subscribe();
    const membersRequest = http.expectOne(endpoint);
    expect(membersRequest.request.method).toBe('GET');
    membersRequest.flush([]);

    service.getCandidates().subscribe();
    const candidatesRequest = http.expectOne(`${endpoint}/candidates`);
    expect(candidatesRequest.request.method).toBe('GET');
    candidatesRequest.flush([]);
  });

  it('adds and removes a member organization', () => {
    const organizationId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    service.addMember(organizationId).subscribe();
    const addRequest = http.expectOne(endpoint);
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({ memberOrganizationId: organizationId });
    addRequest.flush({});

    service.removeMember(organizationId).subscribe();
    const removeRequest = http.expectOne(`${endpoint}/${organizationId}`);
    expect(removeRequest.request.method).toBe('DELETE');
    removeRequest.flush(null);
  });
});
