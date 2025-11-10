import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Tipos de notificaciones
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Interfaz para notificaciones
 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

/**
 * Servicio para manejo de notificaciones
 * Proporciona un sistema centralizado para mostrar mensajes al usuario
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private readonly defaultDuration = 5000; // 5 segundos

  /**
   * Muestra una notificación de éxito
   * @param title - Título de la notificación
   * @param message - Mensaje de la notificación
   * @param duration - Duración en milisegundos (opcional)
   */
  showSuccess(title: string, message: string, duration?: number): void {
    this.showNotification({
      type: 'success',
      title,
      message,
      duration: duration || this.defaultDuration
    });
  }

  /**
   * Muestra una notificación de error
   * @param title - Título de la notificación
   * @param message - Mensaje de la notificación
   * @param duration - Duración en milisegundos (opcional)
   */
  showError(title: string, message: string, duration?: number): void {
    this.showNotification({
      type: 'error',
      title,
      message,
      duration: duration || this.defaultDuration
    });
  }

  /**
   * Muestra una notificación de advertencia
   * @param title - Título de la notificación
   * @param message - Mensaje de la notificación
   * @param duration - Duración en milisegundos (opcional)
   */
  showWarning(title: string, message: string, duration?: number): void {
    this.showNotification({
      type: 'warning',
      title,
      message,
      duration: duration || this.defaultDuration
    });
  }

  /**
   * Muestra una notificación informativa
   * @param title - Título de la notificación
   * @param message - Mensaje de la notificación
   * @param duration - Duración en milisegundos (opcional)
   */
  showInfo(title: string, message: string, duration?: number): void {
    this.showNotification({
      type: 'info',
      title,
      message,
      duration: duration || this.defaultDuration
    });
  }

  /**
   * Muestra una notificación personalizada
   * @param notification - Objeto de notificación
   */
  showNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date()
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    // Auto-remover la notificación después de la duración especificada
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, notification.duration);
    }
  }

  /**
   * Remueve una notificación específica
   * @param id - ID de la notificación a remover
   */
  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  /**
   * Limpia todas las notificaciones
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Obtiene las notificaciones actuales
   * @returns Array de notificaciones
   */
  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Genera un ID único para las notificaciones
   * @returns ID único
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}



