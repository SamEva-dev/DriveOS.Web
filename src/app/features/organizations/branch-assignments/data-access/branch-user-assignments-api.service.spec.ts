import { provideHttpClient } from '@angular/common/http';

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../../../../core/config/api-config';

import { BranchAssignmentRole } from '../models/branch-assignment-role';

import { BranchAssignmentType } from '../models/branch-assignment-type';

import { BranchUserAssignmentsApiService } from './branch-user-assignments-api.service';

describe('BranchUserAssignmentsApiService', () => {
  let service: BranchUserAssignmentsApiService;

  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),

        {
          provide: API_CONFIG,

          useValue: {
            baseUrl: '/api',
          },
        },
      ],
    });

    service = TestBed.inject(BranchUserAssignmentsApiService);

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  it('should create a branch assignment', () => {
    service
      .create('organization-1', 'branch-1', {
        userId: 'user-1',

        role: BranchAssignmentRole.Instructor,

        assignmentType: BranchAssignmentType.Primary,

        plannedEndAtUtc: null,
      })
      .subscribe((response) => expect(response.id).toBe('assignment-1'));

    const request = httpController.expectOne(
      '/api/organizations/organization-1/branches/branch-1/assignments',
    );

    expect(request.request.method).toBe('POST');

    expect(request.request.body).toEqual({
      userId: 'user-1',

      role: BranchAssignmentRole.Instructor,

      assignmentType: BranchAssignmentType.Primary,

      plannedEndAtUtc: null,
    });

    request.flush({
      id: 'assignment-1',
    });
  });

  it('should load assignments by branch with filters', () => {
    service
      .getByBranch('organization-1', 'branch-1', {
        pageNumber: 2,

        pageSize: 20,

        search: 'user',

        status: 'Active',

        role: 'Instructor',

        assignmentType: 'Primary',

        sortBy: 'createdAtUtc',

        sortDirection: 'desc',
      })
      .subscribe();

    const request = httpController.expectOne(
      (request) =>
        request.url === '/api/organizations/organization-1/branches/branch-1/assignments',
    );

    expect(request.request.method).toBe('GET');

    expect(request.request.params.get('pageNumber')).toBe('2');

    expect(request.request.params.get('pageSize')).toBe('20');

    expect(request.request.params.get('status')).toBe('Active');

    expect(request.request.params.get('role')).toBe('Instructor');

    expect(request.request.params.get('assignmentType')).toBe('Primary');

    request.flush({
      items: [],
      pageNumber: 2,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: true,
      hasNextPage: false,
    });
  });

  it('should suspend an assignment', () => {
    service
      .suspend('organization-1', 'assignment-1', {
        reason: 'Absence temporaire.',
      })
      .subscribe();

    const request = httpController.expectOne(
      '/api/organizations/organization-1/branch-assignments/assignment-1/suspend',
    );

    expect(request.request.method).toBe('POST');

    expect(request.request.body).toEqual({
      reason: 'Absence temporaire.',
    });

    request.flush(null);
  });
});
