import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { NotificationContainerComponent } from './shared/components/notification-container/notification-container.component';

/**
 * Componente principal de la aplicación
 * Actúa como el contenedor raíz que incluye el layout principal, router outlet y notificaciones
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LayoutComponent, NotificationContainerComponent],
  template: `
    <app-layout>
      <router-outlet></router-outlet>
    </app-layout>
    <app-notification-container></app-notification-container>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Banking Portal';
}
