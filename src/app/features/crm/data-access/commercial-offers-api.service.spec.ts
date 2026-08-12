import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_CONFIG } from '../../../core/config/api-config';
import { CommercialOffersApiService } from './commercial-offers-api.service';

describe('CommercialOffersApiService', () => {
  let service: CommercialOffersApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(),
      { provide: API_CONFIG, useValue: { baseUrl: '/api' } }] });
    service = TestBed.inject(CommercialOffersApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('generates an offer from the validated assessment session', () => {
    service.generate('lead-1', {
      assessmentSessionId: 'session-1', branchId: null, trainingCode: 'B', currency: 'EUR',
      validUntilUtc: '2026-09-12T00:00:00.000Z', estimatedFundingAmount: 0,
      financingNotes: null, conditions: null, internalNotes: null, lines: [],
    }).subscribe();
    const request = http.expectOne('/api/crm/leads/lead-1/offers');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.assessmentSessionId).toBe('session-1');
    request.flush({ offerId: 'offer-1' });
  });

  it('loads a frozen offer preview', () => {
    service.getById('offer-1').subscribe();
    const request = http.expectOne('/api/crm/offers/offer-1');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'offer-1', lines: [] });
  });

  it('creates a variant from an existing offer', () => {
    service.createVariant('offer-1', { trainingCode: 'B-CONFORT',
      validUntilUtc: '2026-09-12T00:00:00.000Z', estimatedFundingAmount: 0,
      financingNotes: null, conditions: null, internalNotes: null, lines: [] }).subscribe();
    const request = http.expectOne('/api/crm/offers/offer-1/variants');
    expect(request.request.method).toBe('POST');
    request.flush({ offerId: 'offer-2' });
  });

  it('sends an approved frozen offer to explicit recipients', () => {
    service.send('offer-1', { channel: 'Email', recipients: [
      { type: 'Prospect', displayName: 'Sophie Martin', address: 'sophie@example.test' }],
      subject: 'Offer', message: 'Message', language: 'fr', documentReference: 'offer.pdf',
      attachmentReferences: [], secureLinkLifetimeHours: 168 }).subscribe();
    const request = http.expectOne('/api/crm/offers/offer-1/send');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.recipients.length).toBe(1);
    request.flush({ offerId: 'offer-1', offerStatus: 'Approved', deliveryStatus: 'Ready',
      secureLinkToken: 'token', secureLinkExpiresAtUtc: '2026-08-19T00:00:00Z' });
  });
});
