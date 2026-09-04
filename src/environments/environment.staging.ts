const origin = typeof window !== 'undefined' ? window.location.origin : '';

export const environment = {
  AUTH_CLIENT_ID: 'driveos-web',
  BASE_AUTH_API: `${origin}/auth`,
  BASE_DRIVEOS_API: `${origin}/api`,
  production: true,
};
