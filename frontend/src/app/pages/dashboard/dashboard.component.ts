import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TodosStore } from '../../core/todos/todos.store';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { TodoListComponent } from '../../todos/todo-list/todo-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, LoadingSpinnerComponent, TodoListComponent],
  template: `
    <h1 class="page-title">
      Good {{ greeting }}, {{ auth.currentUser()?.displayName ?? 'there' }}!
    </h1>

    <div class="stats-row">
      <mat-card class="stat-card" routerLink="/todos/all">
        <mat-card-content>
          <mat-icon class="stat-icon total-icon">list_alt</mat-icon>
          <div class="stat-value">{{ store.totalCount() }}</div>
          <div class="stat-label">Total</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card" routerLink="/todos/active">
        <mat-card-content>
          <mat-icon class="stat-icon active-icon">pending</mat-icon>
          <div class="stat-value">{{ store.activeCount() }}</div>
          <div class="stat-label">Active</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card" routerLink="/todos/completed">
        <mat-card-content>
          <mat-icon class="stat-icon done-icon">task_alt</mat-icon>
          <div class="stat-value">{{ store.completedCount() }}</div>
          <div class="stat-label">Done</div>
        </mat-card-content>
      </mat-card>
    </div>

    <div class="section-header">
      <h2>Recent Tasks</h2>
      <a mat-button routerLink="/todos/all">View all</a>
    </div>

    @if (store.loading()) {
      <app-loading-spinner />
    } @else {
      <app-todo-list [todos]="recent()" emptyMessage="No tasks yet" />
    }
  `,
  styles: [
    `
      .page-title {
        margin: 0 0 24px;
        font-size: 1.5rem;
      }
      .stats-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 32px;
      }
      .stat-card {
        cursor: pointer;
        transition: box-shadow 0.2s;
      }
      .stat-card:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
      mat-card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px 0 !important;
      }
      .stat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        margin-bottom: 8px;
      }
      .total-icon { color: #1976d2; }
      .active-icon { color: #f57c00; }
      .done-icon { color: #388e3c; }
      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
      }
      .stat-label {
        font-size: 0.8rem;
        color: #757575;
        margin-top: 4px;
      }
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .section-header h2 {
        margin: 0;
      }
      @media (max-width: 600px) {
        .stats-row { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly store = inject(TodosStore);
  readonly recent = computed(() => this.store.todos().slice(0, 5));

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  }

  ngOnInit(): void {
    this.store.load();
  }
}
