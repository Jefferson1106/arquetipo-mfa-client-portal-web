import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '@core/services/notification.service';
import { NotificationComponent } from '../notification/notification.component';
import { Subject, takeUntil } from 'rxjs';

/**
 * Componente contenedor de notificaciones
 * Muestra todas las notificaciones activas en la aplicación
 */
@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  template: `
    <div class="notification-container">
      <app-notification
        *ngFor="let notification of notifications"
        [notification]="notification"
        (close)="onCloseNotification($event)">
      </app-notification>
    </div>
  `,
  styleUrls: ['./notification-container.component.scss']
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Maneja el cierre de una notificación
   */
  onCloseNotification(notificationId: string): void {
    this.notificationService.removeNotification(notificationId);
  }
}



