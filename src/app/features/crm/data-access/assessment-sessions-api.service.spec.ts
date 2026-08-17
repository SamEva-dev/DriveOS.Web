import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { API_CONFIG } from '../../../core/config/api-config';
import { AssessmentSessionsApiService } from './assessment-sessions-api.service';

describe('AssessmentSessionsApiService', () => {
  let service: AssessmentSessionsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api' } },
      ],
    });
    service = TestBed.inject(AssessmentSessionsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the session by appointment', () => {
    service.getSession('appointment-1').subscribe();
    const request = http.expectOne('/api/crm/assessments/appointment-1/session');
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('saves the structured draft', () => {
    service
      .saveDraft('appointment-1', {
        answers: [{ questionId: 'q1', value: 'acquired' }],
        factualObservations: null,
        pedagogicalInterpretation: null,
        recommendation: null,
        internalNotes: null,
        prospectComment: null,
        draftCompleted: false,
      })
      .subscribe();
    const request = http.expectOne('/api/crm/assessments/appointment-1/session/draft');
    expect(request.request.method).toBe('PUT');
    request.flush(null);
  });

  it('loads the assessment result', () => {
    service.getResult('appointment-1').subscribe();
    const request = http.expectOne('/api/crm/assessments/appointment-1/result');
    expect(request.request.method).toBe('GET');
    request.flush({ status: 'Draft', revision: 1 });
  });

  it('saves the result with its expected revision', () => {
    service
      .saveResult('appointment-1', {
        expectedRevision: 4,
        confidence: 'Medium',
        aiSuggestion: null,
        result: {
          summary: 'Summary',
          masteredPoints: [],
          improvementPoints: [],
          supportNeeds: [],
          theoryHours: null,
          practicalHoursMin: 20,
          practicalHoursMax: 26,
          simulatorHours: 2,
          roadHours: 20,
          intermediateAssessments: 1,
          languageSupportRequired: false,
          adaptedEquipmentRequired: false,
          recommendedDeliveryMode: 'OnSite',
          recommendedTraining: 'Driving licence B',
          alternatives: [],
          prospectComment: 'Estimate may change.',
        },
      })
      .subscribe();
    const request = http.expectOne('/api/crm/assessments/appointment-1/result');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.expectedRevision).toBe(4);
    request.flush(null);
  });

  it('validates the current result revision', () => {
    service.validateResult('appointment-1', 5).subscribe();
    const request = http.expectOne('/api/crm/assessments/appointment-1/result/validate');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ expectedRevision: 5 });
    request.flush(null);
  });
});
