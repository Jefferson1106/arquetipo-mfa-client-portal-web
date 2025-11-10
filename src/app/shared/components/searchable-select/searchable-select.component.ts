import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

/**
 * Interfaz para opciones del select
 */
export interface SelectOption {
  value: any;
  label: string;
  secondaryLabel?: string;
}

/**
 * Componente de select con búsqueda
 * Permite buscar y seleccionar de listas grandes
 */
@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="searchable-select">
      <div class="search-input-wrapper">
        <input
          type="text"
          class="search-input"
          [placeholder]="placeholder"
          [(ngModel)]="searchTerm"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (input)="filterOptions()"
          [disabled]="disabled"
          autocomplete="off"
        />
        <span class="dropdown-icon">▼</span>
      </div>
      
      <div *ngIf="showDropdown && filteredOptions.length > 0" class="dropdown-list">
        <div
          *ngFor="let option of filteredOptions"
          class="dropdown-item"
          [class.selected]="option.value === selectedValue"
          (mousedown)="selectOption(option)">
          <div class="option-label">{{ option.label }}</div>
          <div *ngIf="option.secondaryLabel" class="option-secondary">{{ option.secondaryLabel }}</div>
        </div>
      </div>
      
      <div *ngIf="showDropdown && filteredOptions.length === 0 && searchTerm" class="dropdown-list">
        <div class="dropdown-item no-results">
          No se encontraron resultados
        </div>
      </div>
    </div>
  `,
  styles: [`
    .searchable-select {
      position: relative;
      width: 100%;
    }

    .search-input-wrapper {
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 10px 35px 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      background-color: white;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .search-input:focus {
      outline: none;
      border-color: #1976D2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }

    .search-input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .dropdown-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: #666;
      font-size: 10px;
    }

    .dropdown-list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      margin-top: 4px;
      max-height: 250px;
      overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
    }

    .dropdown-item {
      padding: 10px 12px;
      cursor: pointer;
      transition: background-color 0.15s;
      border-bottom: 1px solid #f0f0f0;
    }

    .dropdown-item:last-child {
      border-bottom: none;
    }

    .dropdown-item:hover {
      background-color: #f5f5f5;
    }

    .dropdown-item.selected {
      background-color: #e3f2fd;
      color: #1976D2;
    }

    .dropdown-item.no-results {
      color: #999;
      cursor: default;
      text-align: center;
    }

    .dropdown-item.no-results:hover {
      background-color: white;
    }

    .option-label {
      font-weight: 500;
      color: #333;
    }

    .option-secondary {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }

    .dropdown-item.selected .option-label {
      color: #1976D2;
    }
  `]
})
export class SearchableSelectComponent implements ControlValueAccessor, OnInit {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Buscar...';
  @Input() disabled = false;

  searchTerm = '';
  filteredOptions: SelectOption[] = [];
  selectedValue: any = null;
  showDropdown = false;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.filteredOptions = this.options;
  }

  /**
   * Filtra las opciones según el término de búsqueda
   */
  filterOptions(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredOptions = this.options;
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredOptions = this.options.filter(option =>
      option.label.toLowerCase().includes(searchLower) ||
      (option.secondaryLabel && option.secondaryLabel.toLowerCase().includes(searchLower))
    );
  }

  /**
   * Selecciona una opción
   */
  selectOption(option: SelectOption): void {
    this.selectedValue = option.value;
    this.searchTerm = option.label;
    this.showDropdown = false;
    this.onChange(option.value);
    this.onTouched();
  }

  /**
   * Maneja el foco del input
   */
  onFocus(): void {
    this.showDropdown = true;
    this.filterOptions();
  }

  /**
   * Maneja la pérdida de foco
   */
  onBlur(): void {
    setTimeout(() => {
      this.showDropdown = false;
      
      // Si no hay selección válida, limpiar
      if (!this.selectedValue) {
        this.searchTerm = '';
      }
    }, 200);
  }

  // Implementación de ControlValueAccessor
  writeValue(value: any): void {
    this.selectedValue = value;
    if (value) {
      const option = this.options.find(opt => opt.value === value);
      if (option) {
        this.searchTerm = option.label;
      }
    } else {
      this.searchTerm = '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

