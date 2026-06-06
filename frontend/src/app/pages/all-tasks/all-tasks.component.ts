import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TodosStore } from '../../core/todos/todos.store';
import { TaskPageShellComponent } from '../../shared/task-page-shell/task-page-shell.component';

@Component({
  selector: 'app-all-tasks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskPageShellComponent],
  template: `
    <app-task-page-shell
      title="All Tasks"
      [todos]="store.todos()"
      emptyMessage="No tasks yet"
      [loading]="store.loading()"
    />
  `,
})
export class AllTasksComponent implements OnInit {
  readonly store = inject(TodosStore);

  ngOnInit(): void {
    this.store.load();
  }
}
