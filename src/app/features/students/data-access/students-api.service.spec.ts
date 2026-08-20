import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../../../core/config/api-config';
import { StudentsApiService } from './students-api.service';

describe('StudentsApiService', () => {
  let service: StudentsApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'https://api.driveos.test/api' } },
      ],
    });
    service = TestBed.inject(StudentsApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads every authorized profile resource from the student boundary', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    service.getIdentity(id).subscribe();
    service.getAdministration(id).subscribe();
    service.getGuardians(id).subscribe();
    service.getRelationships(id).subscribe();
    for (const resource of ['identity', 'administration', 'guardians', 'relationships']) {
      const request = http.expectOne(`https://api.driveos.test/api/students/${id}/${resource}`);
      expect(request.request.method).toBe('GET');
      request.flush({});
    }
  });

  it('loads enrollment checklist and documents with the enrollment filter', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const enrollmentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    service.getEnrollmentChecklist(id, enrollmentId).subscribe();
    service.getDocuments(id, enrollmentId).subscribe();
    for (const resource of ['enrollment-checklist', 'documents']) {
      const request = http.expectOne(
        (candidate) => candidate.url === `https://api.driveos.test/api/students/${id}/${resource}`,
      );
      expect(request.request.params.get('enrollmentId')).toBe(enrollmentId);
      request.flush({});
    }
  });

  it('loads branch and instructor assignment portfolios', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    service.getBranches(id).subscribe();
    service.getInstructors(id).subscribe();
    for (const resource of ['branches', 'instructors']) {
      const request = http.expectOne(`https://api.driveos.test/api/students/${id}/${resource}`);
      expect(request.request.method).toBe('GET');
      request.flush({});
    }
  });

  it('loads the consolidated student status board', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    service.getStatuses(id).subscribe();
    const request = http.expectOne(`https://api.driveos.test/api/students/${id}/statuses`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('loads internal and external mobility histories', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    service.getInternalTransfers(id).subscribe();
    service.getExternalTransfers(id).subscribe();
    for (const type of ['internal', 'external']) {
      const request = http.expectOne(
        `https://api.driveos.test/api/students/${id}/transfers/${type}`,
      );
      expect(request.request.method).toBe('GET');
      request.flush([]);
    }
  });

  it('loads suspension, reactivation and closure lifecycles independently', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    service.getSuspensions(id).subscribe();
    service.getReactivations(id).subscribe();
    service.getClosures(id).subscribe();
    for (const resource of ['suspension', 'reactivate', 'close']) {
      const request = http.expectOne(`https://api.driveos.test/api/students/${id}/${resource}`);
      expect(request.request.method).toBe('GET');
      request.flush([]);
    }
  });

  it('creates, reviews and applies an enrollment reactivation', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const reactivationId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const request = {
      suspensionId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      mode: 2 as const,
      resumeDate: '2026-08-18',
      conditions: '',
      pedagogyReviewRequested: false,
      checks: [{ type: 1, status: 1 as const, detail: 'Resolved' }],
    };

    service.createReactivation(id, request).subscribe();
    let httpRequest = http.expectOne(`https://api.driveos.test/api/students/${id}/reactivate`);
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body.suspensionId).toBe(request.suspensionId);
    httpRequest.flush(reactivationId);

    service
      .reviewReactivationCheck(id, reactivationId, 'Contract', { status: 1, detail: 'Valid' })
      .subscribe();
    httpRequest = http.expectOne(
      `https://api.driveos.test/api/students/${id}/reactivate/${reactivationId}/checks/Contract`,
    );
    expect(httpRequest.request.method).toBe('PUT');
    httpRequest.flush(null);

    service.applyReactivation(id, reactivationId).subscribe();
    httpRequest = http.expectOne(
      `https://api.driveos.test/api/students/${id}/reactivate/${reactivationId}/apply`,
    );
    expect(httpRequest.request.method).toBe('POST');
    httpRequest.flush(null);
  });

  it('creates, reviews, completes, archives and reopens an enrollment closure', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const closureId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const request = {
      enrollmentId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      reason: 1,
      closureDate: '2026-08-18',
      reasonDetail: 'Training completed',
      checks: [{ type: 1, status: 1 as const, detail: '' }],
    };

    service.createClosure(id, request).subscribe();
    let httpRequest = http.expectOne(`https://api.driveos.test/api/students/${id}/close`);
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body.enrollmentId).toBe(request.enrollmentId);
    httpRequest.flush(closureId);

    service
      .reviewClosureCheck(id, closureId, 'FutureSessions', { status: 2, detail: 'Resolved' })
      .subscribe();
    httpRequest = http.expectOne(
      `https://api.driveos.test/api/students/${id}/close/${closureId}/checks/FutureSessions`,
    );
    expect(httpRequest.request.method).toBe('PUT');
    httpRequest.flush(null);

    service.completeClosure(id, closureId).subscribe();
    httpRequest = http.expectOne(
      `https://api.driveos.test/api/students/${id}/close/${closureId}/complete`,
    );
    expect(httpRequest.request.method).toBe('POST');
    httpRequest.flush(null);

    service
      .archiveStudent(id, closureId, {
        retainUntil: '2036-08-18',
        retentionLegalBasis: 'Legal obligation',
        retentionScope: 127,
      })
      .subscribe();
    httpRequest = http.expectOne(
      `https://api.driveos.test/api/students/${id}/close/${closureId}/archive`,
    );
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body.retentionScope).toBe(127);
    httpRequest.flush(null);

    service
      .reopenEnrollment(id, closureId, { justification: 'Administrative correction required.' })
      .subscribe();
    httpRequest = http.expectOne(
      `https://api.driveos.test/api/students/${id}/close/${closureId}/reopen`,
    );
    expect(httpRequest.request.method).toBe('POST');
    httpRequest.flush(null);
  });

  it('creates a direct enrollment with its idempotency key', () => {
    service
      .startDirectEnrollment(
        {
          existingStudentId: null,
          branchId: 'branch-id',
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.test',
          phone: null,
          trainingCode: 'B',
          source: 'DirectBranch',
          regulatoryCountryCode: 'FR',
          preferredLanguageCode: 'fr',
          requiredConsentsAccepted: true,
        },
        'enrollment-key-123',
      )
      .subscribe();
    const request = http.expectOne('https://api.driveos.test/api/students/enrollments/direct');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Idempotency-Key')).toBe('enrollment-key-123');
    request.flush({});
  });

  it('updates the student identity through the dedicated endpoint', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    service
      .updateIdentity(id, {
        legalFirstName: 'Ada',
        legalLastName: 'Lovelace',
        preferredName: null,
        birthDate: null,
        birthPlace: null,
        nationality: null,
        email: 'ada@example.test',
        phone: null,
        addressLine1: null,
        addressLine2: null,
        postalCode: null,
        city: null,
        countryCode: 'FR',
        preferredLanguage: 'fr',
        timeZone: 'Europe/Paris',
        allowEmail: true,
        allowSms: false,
        allowPhone: false,
        justification: 'Correction',
      })
      .subscribe();
    const request = http.expectOne(`https://api.driveos.test/api/students/${id}/identity`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.justification).toBe('Correction');
    request.flush({});
  });
  it('verifies the student identity through the dedicated endpoint', () => {
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    service
      .verifyIdentity(id, {
        status: 'DocumentVerified',
        justification: 'Identity document checked in branch.',
      })
      .subscribe();

    const request = http.expectOne(`https://api.driveos.test/api/students/${id}/identity/verify`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.status).toBe('DocumentVerified');
    expect(request.request.body.justification).toContain('Identity document');
    request.flush({});
  });
});
