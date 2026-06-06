import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Todo } from '../../core/models/todo.model';

export interface TodoFormDialogData {
  todo?: Todo;
}

@Component({
  selector: 'app-todo-form-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.todo ? 'Edit Task' : 'New Task' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Task title</mat-label>
          <input
            matInput
            formControlName="title"
            placeholder="What needs to be done?"
            autofocus
          />
          @if (form.get('title')?.hasError('required')) {
            <mat-error>Title is required</mat-error>
          }
          @if (form.get('title')?.hasError('maxlength')) {
            <mat-error>Title must be under 500 characters</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
        min-width: 320px;
      }
      mat-dialog-content {
        padding-top: 8px !important;
      }
    `,
  ],
})
export class TodoFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<TodoFormDialogComponent>);
  readonly data = inject<TodoFormDialogData>(MAT_DIALOG_DATA);

  readonly form = new FormGroup({
    title: new FormControl(this.data.todo?.title ?? '', {
      validators: [Validators.required, Validators.maxLength(500)],
      nonNullable: true,
    }),
  });

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue().title.trim());
    }
  }
}
