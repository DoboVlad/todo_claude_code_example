import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Todo } from '../models/todo.model';

@Injectable({ providedIn: 'root' })
export class TodosService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Todo[]> {
    return this.http.get<Todo[]>('/api/todos');
  }

  create(title: string): Observable<Todo> {
    return this.http.post<Todo>('/api/todos', { title });
  }

  update(id: string, changes: Partial<Pick<Todo, 'title' | 'completed'>>): Observable<Todo> {
    return this.http.patch<Todo>(`/api/todos/${id}`, changes);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`/api/todos/${id}`);
  }
}
