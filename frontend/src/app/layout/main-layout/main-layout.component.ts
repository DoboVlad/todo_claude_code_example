import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav
        #sidenav
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
        class="app-sidenav"
      >
        <div class="sidenav-header">
          <mat-icon class="brand-icon">check_circle</mat-icon>
          <span class="brand-name">Todo App</span>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-nav">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/todos/all" routerLinkActive="active-nav">
            <mat-icon matListItemIcon>list</mat-icon>
            <span matListItemTitle>All Tasks</span>
          </a>
          <a mat-list-item routerLink="/todos/active" routerLinkActive="active-nav">
            <mat-icon matListItemIcon>radio_button_unchecked</mat-icon>
            <span matListItemTitle>Active</span>
          </a>
          <a mat-list-item routerLink="/todos/completed" routerLinkActive="active-nav">
            <mat-icon matListItemIcon>check_circle_outline</mat-icon>
            <span matListItemTitle>Completed</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="app-toolbar">
          @if (isHandset()) {
            <button mat-icon-button (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span>Todo App</span>
          <span class="flex-spacer"></span>
          @if (auth.currentUser(); as user) {
            <span class="user-name">{{ user.displayName }}</span>
          }
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="page-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .app-container {
        height: 100vh;
      }
      .app-sidenav {
        width: 240px;
      }
      .sidenav-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        font-size: 1.1rem;
        font-weight: 500;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      }
      .brand-icon {
        color: #1976d2;
      }
      .app-toolbar {
        position: sticky;
        top: 0;
        z-index: 1;
      }
      .flex-spacer {
        flex: 1 1 auto;
      }
      .user-name {
        font-size: 0.875rem;
        margin-right: 4px;
      }
      .page-content {
        padding: 24px;
        max-width: 900px;
      }
      .active-nav {
        background: rgba(0, 0, 0, 0.06);
        border-radius: 4px;
      }
    `,
  ],
})
export class MainLayoutComponent {
  readonly auth = inject(AuthService);

  private readonly breakpoint = inject(BreakpointObserver);

  readonly isHandset = toSignal(
    this.breakpoint.observe(Breakpoints.Handset).pipe(map((r) => r.matches)),
    { initialValue: false },
  );
}
