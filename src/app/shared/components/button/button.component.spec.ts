import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

/**
 * Pruebas unitarias para el componente de botón
 * Verifica el funcionamiento correcto del componente reutilizable
 */
describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default variant', () => {
    // Updated: component uses 'type' input instead of 'variant'
    expect(component.type).toBe('primary');
  });

  it('should have default size', () => {
    // Updated: size options are 'small' | 'medium' | 'large'
    expect(component.size).toBe('medium');
  });

  it('should not be disabled by default', () => {
    expect(component.disabled).toBeFalse();
  });

  it('should emit click event', () => {
    spyOn(component.clicked, 'emit');
    const mockEvent = new MouseEvent('click');
    component.handleClick(mockEvent);
    expect(component.clicked.emit).toHaveBeenCalledWith(mockEvent);
  });

  it('should generate correct CSS classes for primary variant', () => {
    component.type = 'primary';
    component.size = 'medium';
    
    const classes = component.buttonClasses;
    
    expect(classes).toContain('btn');
    expect(classes).toContain('btn-primary');
    expect(classes).toContain('btn-medium');
  });

  it('should generate correct CSS classes for disabled state', () => {
    component.disabled = true;
    
    const classes = component.buttonClasses;
    
    expect(classes).toContain('btn-disabled');
  });

  it('should generate correct CSS classes for full width', () => {
    component.fullWidth = true;
    
    const classes = component.buttonClasses;
    
    expect(classes).toContain('btn-full-width');
  });
});



