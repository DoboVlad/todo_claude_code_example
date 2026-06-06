import { Injectable, computed, inject, signal } from '@angular/core';
import { Todo } from '../models/todo.model';
import { TodosService } from './todos.service';

@Injectable({ providedIn: 'root' })
export class TodosStore {
  private readonly svc = inject(TodosService);

  private readonly _todos = signal<Todo[]>([]);
  private readonly _loading = signal(false);

  readonly todos = this._todos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly activeTodos = computed(() => this._todos().filter((t) => !t.completed));
  readonly completedTodos = computed(() => this._todos().filter((t) => t.completed));
  readonly totalCount = computed(() => this._todos().length);
  readonly activeCount = computed(() => this.activeTodos().length);
  readonly completedCount = computed(() => this.completedTodos().length);

  load(): void {
    this._loading.set(true);
    this.svc.getAll().subscribe({
      next: (todos) => {
        this._todos.set(todos);
        this._loading.set(false);
      },
      error: () => this._loading.set(false),
    });
  }

  create(title: string): void {
    this.svc.create(title).subscribe({
      next: (todo) => this._todos.update((ts) => [todo, ...ts]),
    });
  }

  toggle(todo: Todo): void {
    this.svc.update(todo.id, { completed: !todo.completed }).subscribe({
      next: (updated) =>
        this._todos.update((ts) => ts.map((t) => (t.id === updated.id ? updated : t))),
    });
  }

  updateTitle(id: string, title: string): void {
    this.svc.update(id, { title }).subscribe({
      next: (updated) =>
        this._todos.update((ts) => ts.map((t) => (t.id === updated.id ? updated : t))),
    });
  }

  remove(id: string): void {
    this.svc.remove(id).subscribe({
      next: () => this._todos.update((ts) => ts.filter((t) => t.id !== id)),
    });
  }
}
