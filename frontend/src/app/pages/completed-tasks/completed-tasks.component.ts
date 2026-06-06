import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TodosStore } from '../../core/todos/todos.store';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { TodoListComponent } from '../../todos/todo-list/todo-list.component';

@Component({
  selector: 'app-completed-tasks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadingSpinnerComponent, TodoListComponent],
  template: `
    <h1 class="page-title">Completed Tasks</h1>
    @if (store.loading()) {
      <app-loading-spinner />
    } @else {
      <app-todo-list
        [todos]="store.completedTodos()"
        emptyMessage="No completed tasks yet"
      />
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
export class CompletedTasksComponent implements OnInit {
  readonly store = inject(TodosStore);

  ngOnInit(): void {
    this.store.load();
  }
}
