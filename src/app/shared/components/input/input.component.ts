import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Componente de input reutilizable
 * Implementa ControlValueAccessor para integración con formularios reactivos
 */
@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="input-container">
      <label *ngIf="label" [for]="inputId" class="input-label">
        {{ label }}
        <span *ngIf="required" class="required-indicator">*</span>
      </label>
      <div class="input-wrapper">
        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="disabled"
          [readonly]="readonly"
          [attr.maxlength]="maxlength"
          [class]="inputClasses"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
        />
        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' = 'text';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() errorMessage = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() maxlength?: number;

  @Output() focus = new EventEmitter<FocusEvent>();
  @Output() blur = new EventEmitter<FocusEvent>();

  value = '';
  inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  /**
   * Genera las clases CSS del input basadas en las propiedades
   */
  get inputClasses(): string {
    const classes = ['input'];
    classes.push(`input-${this.size}`);
    
    if (this.errorMessage) {
      classes.push('input-error');
    }
    
    if (this.disabled) {
      classes.push('input-disabled');
    }
    
    return classes.join(' ');
  }

  /**
   * Maneja el evento de input
   */
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  /**
   * Maneja el evento de focus
   */
  onFocus(): void {
    this.focus.emit();
  }

  /**
   * Maneja el evento de blur
   */
  onBlur(): void {
    this.onTouched();
    this.blur.emit();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
