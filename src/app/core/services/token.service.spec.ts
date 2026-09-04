import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    service = new TokenService();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps the access token in session storage and never persists the refresh token', () => {
    service.setRememberMe(true);
    service.save({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAtUtc: '2026-09-03T10:00:00.000Z',
    });

    expect(sessionStorage.getItem('driveos.auth.access')).toBe('access-token');
    expect(sessionStorage.getItem('driveos.auth.refresh')).toBeNull();
    expect(localStorage.getItem('driveos.auth.access')).toBeNull();
    expect(localStorage.getItem('driveos.auth.refresh')).toBeNull();
  });

  it('removes tokens persisted by a previous application version', () => {
    localStorage.setItem('driveos.auth.access', 'legacy-access');
    localStorage.setItem('driveos.auth.refresh', 'legacy-refresh');

    expect(service.load()).toBeNull();
    expect(localStorage.getItem('driveos.auth.access')).toBeNull();
    expect(localStorage.getItem('driveos.auth.refresh')).toBeNull();
  });
});
