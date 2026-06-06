import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Todo } from '../../core/models/todo.model';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { TodoListComponent } from '../../todos/todo-list/todo-list.component';

@Component({
  selector: 'app-task-page-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingSpinnerComponent, TodoListComponent],
  template: `
    <h1 class="page-title">{{ title() }}</h1>
    @if (loading()) {
      <app-loading-spinner />
    } @else {
      <app-todo-list [todos]="todos()" [emptyMessage]="emptyMessage()" />
    }
  `,
  styles: [
    `
      .page-title {
        margin: 0 0 16px;
        font-size: 1.5rem;
      }
    `,
  ],
})
export class TaskPageShellComponent {
  title = input.required<string>();
  todos = input.required<Todo[]>();
  emptyMessage = input<string>('No tasks');
  loading = input.required<boolean>();
}
