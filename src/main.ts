import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';

// Configuración principal de la aplicación Angular
// Inicializa la aplicación con el componente raíz y configura los proveedores necesarios
bootstrapApplication(AppComponent, {
  providers: [
    // Configuración del enrutador con las rutas definidas
    provideRouter(routes),
    // Configuración del cliente HTTP para comunicación con APIs
    provideHttpClient(withInterceptorsFromDi()),
    // Importación de módulos necesarios para animaciones
    importProvidersFrom(BrowserAnimationsModule)
  ]
}).catch(err => console.error(err));


