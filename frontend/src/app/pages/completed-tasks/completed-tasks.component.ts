import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TodosStore } from '../../core/todos/todos.store';
import { TaskPageShellComponent } from '../../shared/task-page-shell/task-page-shell.component';

@Component({
  selector: 'app-completed-tasks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskPageShellComponent],
  template: `
    <app-task-page-shell
      title="Completed Tasks"
      [todos]="store.completedTodos()"
      emptyMessage="No completed tasks yet"
      [loading]="store.loading()"
    />
  `,
})
export class CompletedTasksComponent implements OnInit {
  readonly store = inject(TodosStore);

  ngOnInit(): void {
    this.store.load();
  }
}
