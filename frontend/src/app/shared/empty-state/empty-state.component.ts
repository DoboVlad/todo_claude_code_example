import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      <p class="empty-message">{{ message }}</p>
      @if (subtitle) {
        <p class="empty-subtitle">{{ subtitle }}</p>
      }
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px 16px;
        color: #9e9e9e;
      }
      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }
      .empty-message {
        font-size: 1.125rem;
        font-weight: 500;
        margin: 0 0 8px;
      }
      .empty-subtitle {
        font-size: 0.875rem;
        margin: 0;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() message = 'Nothing here yet';
  @Input() subtitle = '';
}
