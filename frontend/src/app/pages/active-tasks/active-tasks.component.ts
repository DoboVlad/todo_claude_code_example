import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TodosStore } from '../../core/todos/todos.store';
import { TaskPageShellComponent } from '../../shared/task-page-shell/task-page-shell.component';

@Component({
  selector: 'app-active-tasks',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskPageShellComponent],
  template: `
    <app-task-page-shell
      title="Active Tasks"
      [todos]="store.activeTodos()"
      emptyMessage="No active tasks"
      [loading]="store.loading()"
    />
  `,
})
export class ActiveTasksComponent implements OnInit {
  readonly store = inject(TodosStore);

  ngOnInit(): void {
    this.store.load();
  }
}
