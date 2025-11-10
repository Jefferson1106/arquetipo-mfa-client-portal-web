import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Tipos de botón disponibles
 */
export type ButtonType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

/**
 * Tamaños de botón disponibles
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Componente de botón reutilizable
 * Proporciona un botón estilizado con diferentes variantes y tamaños
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="htmlType"
      [class]="buttonClasses"
      [disabled]="disabled || loading"
      (click)="handleClick($event)"
    >
      <span *ngIf="loading" class="spinner"></span>
      <span [class.loading-text]="loading">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  /**
   * Tipo de botón (afecta el estilo)
   */
  @Input() type: ButtonType = 'primary';

  /**
   * Tamaño del botón
   */
  @Input() size: ButtonSize = 'medium';

  /**
   * Si el botón está deshabilitado
   */
  @Input() disabled: boolean = false;

  /**
   * Si el botón muestra estado de carga
   */
  @Input() loading: boolean = false;

  /**
   * Si el botón ocupa todo el ancho disponible
   */
  @Input() fullWidth: boolean = false;

  /**
   * Tipo HTML del botón
   */
  @Input() htmlType: 'button' | 'submit' | 'reset' = 'button';

  /**
   * Clases CSS adicionales
   */
  @Input() customClass: string = '';

  /**
   * Evento emitido cuando se hace click en el botón
   */
  @Output() clicked = new EventEmitter<MouseEvent>();

  /**
   * Obtiene las clases CSS del botón
   */
  get buttonClasses(): string {
    const classes = [
      'btn',
      `btn-${this.type}`,
      `btn-${this.size}`
    ];

    if (this.fullWidth) {
      classes.push('btn-full-width');
    }

    if (this.loading) {
      classes.push('btn-loading');
    }

    if (this.disabled) {
      classes.push('btn-disabled');
    }

    if (this.customClass) {
      classes.push(this.customClass);
    }

    return classes.join(' ');
  }

  /**
   * Maneja el evento click del botón
   */
  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}

