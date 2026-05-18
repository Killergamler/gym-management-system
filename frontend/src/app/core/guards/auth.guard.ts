import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const role = auth.getUser()?.role;
  const requiredRole = route.data['role'] as string | undefined;
  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (requiredRole && role !== requiredRole) {
    router.navigate([role === 'admin' ? '/admin/dashboard' : '/user/dashboard']);
    return false;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    router.navigate([role === 'admin' ? '/admin/dashboard' : '/user/dashboard']);
    return false;
  }

  return true;
};
