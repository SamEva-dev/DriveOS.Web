import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const guestGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!(await auth.checkAuth())) return true;
  const returnUrl = route.queryParamMap.get('returnUrl');
  return returnUrl ? router.parseUrl(returnUrl) : router.createUrlTree(['/dashboard']);
};
