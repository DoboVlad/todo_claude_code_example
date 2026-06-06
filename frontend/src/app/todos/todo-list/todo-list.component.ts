import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Todo } from '../../core/models/todo.model';
import { TodosStore } from '../../core/todos/todos.store';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import {
  TodoFormDialogComponent,
  TodoFormDialogData,
} from '../todo-form-dialog/todo-form-dialog.component';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    EmptyStateComponent,
  ],
  template: `
    <div class="list-toolbar">
      <button mat-flat-button (click)="openCreate()">
        <mat-icon>add</mat-icon>
        Add Task
      </button>
    </div>

    @if (todos.length === 0) {
      <app-empty-state
        icon="assignment_turned_in"
        [message]="emptyMessage"
        subtitle="Click 'Add Task' to get started"
      />
    } @else {
      <mat-list class="todo-list">
        @for (todo of todos; track todo.id) {
          <mat-list-item class="todo-item">
            <mat-checkbox
              matListItemIcon
              [checked]="todo.completed"
              (change)="store.toggle(todo)"
            />
            <span
              matListItemTitle
              [class.completed-title]="todo.completed"
            >{{ todo.title }}</span>
            <div matListItemMeta class="item-actions">
              <button mat-icon-button matTooltip="Edit" (click)="openEdit(todo)">
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                matTooltip="Delete"
                class="delete-btn"
                (click)="openDelete(todo)"
              >
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>
          </mat-list-item>
          <mat-divider />
        }
      </mat-list>
    }
  `,
  styles: [
    `
      .list-toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;
      }
      .todo-list {
        padding: 0;
      }
      .todo-item {
        --mdc-list-list-item-one-line-container-height: 60px;
      }
      .completed-title {
        text-decoration: line-through;
        opacity: 0.5;
      }
      .item-actions {
        display: flex;
        gap: 4px;
      }
      .delete-btn {
        color: #e53935;
      }
    `,
  ],
})
export class TodoListComponent {
  @Input() todos: Todo[] = [];
  @Input() emptyMessage = 'No tasks here';

  readonly store = inject(TodosStore);
  private readonly dialog = inject(MatDialog);

  openCreate(): void {
    this.dialog
      .open<TodoFormDialogComponent, TodoFormDialogData, string>(TodoFormDialogComponent, {
        data: {},
        width: '440px',
      })
      .afterClosed()
      .subscribe((title) => {
        if (title) this.store.create(title);
      });
  }

  openEdit(todo: Todo): void {
    this.dialog
      .open<TodoFormDialogComponent, TodoFormDialogData, string>(TodoFormDialogComponent, {
        data: { todo },
        width: '440px',
      })
      .afterClosed()
      .subscribe((title) => {
        if (title && title !== todo.title) this.store.updateTitle(todo.id, title);
      });
  }

  openDelete(todo: Todo): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Delete task',
          message: `Delete "${todo.title}"? This cannot be undone.`,
          confirmText: 'Delete',
        },
        width: '360px',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.store.remove(todo.id);
      });
  }
}
