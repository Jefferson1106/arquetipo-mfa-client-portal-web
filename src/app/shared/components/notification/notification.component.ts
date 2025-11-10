import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification, NotificationType } from '@core/services/notification.service';

/**
 * Componente de notificación individual
 * Muestra una notificación con diferentes tipos y estilos
 */
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="notificationClasses" (click)="onClose()">
      <div class="notification-icon">
        <span [innerHTML]="getIcon()"></span>
      </div>
      <div class="notification-content">
        <h4 class="notification-title">{{ notification.title }}</h4>
        <p class="notification-message">{{ notification.message }}</p>
      </div>
      <button class="notification-close" (click)="onClose()">
        ×
      </button>
    </div>
  `,
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  @Input() notification!: Notification;
  @Output() close = new EventEmitter<string>();

  /**
   * Genera las clases CSS de la notificación
   */
  get notificationClasses(): string {
    const classes = ['notification'];
    classes.push(`notification-${this.notification.type}`);
    return classes.join(' ');
  }

  /**
   * Obtiene el icono según el tipo de notificación
   */
  getIcon(): string {
    switch (this.notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }

  /**
   * Maneja el cierre de la notificación
   */
  onClose(): void {
    this.close.emit(this.notification.id);
  }
}



