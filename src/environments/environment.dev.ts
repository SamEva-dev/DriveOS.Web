const resolveEnv = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  return {
    AUTH_CLIENT_ID: 'driveos-web',
    BASE_AUTH_API: 'https://localhost:8081',
    BASE_DRIVEOS_API: 'https://localhost:9001/api',
    production: false,
  };
};

export const environment = resolveEnv();
