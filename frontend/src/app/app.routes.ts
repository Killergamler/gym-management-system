import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { role: 'admin' },
    loadComponent: () => import('./components/admin/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./components/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'members', loadComponent: () => import('./components/admin/members/members.component').then((m) => m.MembersComponent) },
      { path: 'trainers', loadComponent: () => import('./components/admin/trainers/trainers.component').then((m) => m.TrainersComponent) },
      { path: 'plans', loadComponent: () => import('./components/admin/plans/plans.component').then((m) => m.PlansComponent) },
      { path: 'payments', loadComponent: () => import('./components/admin/payments/payments.component').then((m) => m.PaymentsComponent) },
      { path: 'attendance', loadComponent: () => import('./components/admin/attendance/attendance.component').then((m) => m.AttendanceComponent) }
    ]
  },
  {
    path: 'user',
    canActivate: [authGuard],
    data: { roles: ['member'] },
    loadComponent: () => import('./components/user/layout/layout.component').then((m) => m.UserLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./components/user/dashboard/dashboard.component').then((m) => m.UserDashboardComponent) },
      { path: 'workouts', loadComponent: () => import('./components/user/workouts/workouts.component').then((m) => m.WorkoutsComponent) },
      { path: 'membership', loadComponent: () => import('./components/user/membership/membership.component').then((m) => m.MembershipComponent) },
      { path: 'attendance', loadComponent: () => import('./components/user/attendance/attendance.component').then((m) => m.UserAttendanceComponent) }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
