import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Sign in</mat-card-title>
          <mat-card-subtitle>Welcome back!</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
            <mat-form-field appearance="outline" class="field">
              <mat-label>Email</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <mat-error>Enter a valid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="field">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input
                matInput
                [type]="showPw() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
              />
              <button mat-icon-button matSuffix type="button" (click)="showPw.set(!showPw())">
                <mat-icon>{{ showPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            @if (errorMsg()) {
              <p class="error-msg">{{ errorMsg() }}</p>
            }

            <button
              mat-flat-button
              type="submit"
              class="field submit-btn"
              [disabled]="loading() || form.invalid"
            >
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Sign in
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="auth-footer">
          <p>Don't have an account? <a routerLink="/register">Create one</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .auth-card {
        width: 100%;
        max-width: 400px;
      }
      .auth-form {
        display: flex;
        flex-direction: column;
        margin-top: 8px;
      }
      .field {
        width: 100%;
      }
      .submit-btn {
        margin-top: 8px;
        height: 44px;
      }
      .error-msg {
        color: #e53935;
        font-size: 0.875rem;
        margin: 0 0 8px;
      }
      .auth-footer {
        justify-content: center;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMsg = signal('');
  readonly showPw = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', {
      validators: [(c) => Validators.required(c), (c) => Validators.email(c)],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [(c) => Validators.required(c)],
      nonNullable: true,
    }),
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigate(['/dashboard']),
      error: (err: unknown) => {
        this.loading.set(false);
        const message =
          err instanceof HttpErrorResponse
            ? ((err.error as { message?: string }).message ?? 'Login failed. Please try again.')
            : 'Login failed. Please try again.';
        this.errorMsg.set(message);
      },
    });
  }
}
