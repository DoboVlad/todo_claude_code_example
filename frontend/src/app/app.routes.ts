import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'todos/all',
        loadComponent: () =>
          import('./pages/all-tasks/all-tasks.component').then((m) => m.AllTasksComponent),
      },
      {
        path: 'todos/active',
        loadComponent: () =>
          import('./pages/active-tasks/active-tasks.component').then((m) => m.ActiveTasksComponent),
      },
      {
        path: 'todos/completed',
        loadComponent: () =>
          import('./pages/completed-tasks/completed-tasks.component').then(
            (m) => m.CompletedTasksComponent,
          ),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
