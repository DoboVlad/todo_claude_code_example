import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="spinner-wrap">
      <mat-spinner [diameter]="diameter" />
    </div>
  `,
  styles: [
    `
      .spinner-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 48px;
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  @Input() diameter = 48;
}
