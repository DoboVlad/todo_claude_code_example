import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _accessToken = signal<string | null>(localStorage.getItem('access_token'));
  private readonly _currentUser = signal<User | null>(null);
  private _refreshInFlight: Observable<string> | null = null;

  readonly accessToken = this._accessToken.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());

  constructor() {
    if (this._accessToken()) {
      this.fetchMe();
    }
  }

  register(email: string, password: string, displayName: string): Observable<void> {
    return this.http
      .post<{ user: User; accessToken: string }>('/api/auth/register', {
        email,
        password,
        displayName,
      })
      .pipe(
        tap((res) => this.setSession(res.accessToken, res.user)),
        map(() => void 0),
      );
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<{ user: User; accessToken: string }>('/api/auth/login', { email, password })
      .pipe(
        tap((res) => this.setSession(res.accessToken, res.user)),
        map(() => void 0),
      );
  }

  logout(): void {
    this.http
      .post('/api/auth/logout', {})
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.clearSession();
        void this.router.navigate(['/login']);
      });
  }

  refresh(): Observable<string> {
    if (this._refreshInFlight) return this._refreshInFlight;

    this._refreshInFlight = this.http
      .post<{ accessToken: string }>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(
        tap((res) => {
          this._accessToken.set(res.accessToken);
          localStorage.setItem('access_token', res.accessToken);
        }),
        map((res) => res.accessToken),
        finalize(() => { this._refreshInFlight = null; }),
        shareReplay(1),
      );

    return this._refreshInFlight;
  }

  clearSession(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    localStorage.removeItem('access_token');
  }

  private setSession(token: string, user: User): void {
    this._accessToken.set(token);
    this._currentUser.set(user);
    localStorage.setItem('access_token', token);
  }

  private fetchMe(): void {
    this.http.get<User>('/api/auth/me').subscribe({
      next: (user) => this._currentUser.set(user),
      // Interceptor already handles 401 (tries refresh, clears session + navigates on failure).
      // Non-auth errors (network, 5xx) are non-fatal here — user name just won't appear.
      error: () => {},
    });
  }
}
