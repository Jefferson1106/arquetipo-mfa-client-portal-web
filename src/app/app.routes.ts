import { Routes } from '@angular/router';

/**
 * Configuración de rutas de la aplicación
 * Define la navegación entre las diferentes secciones del portal bancario
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/clients',
    pathMatch: 'full'
  },
  {
    path: 'clients',
    loadComponent: () => import('./features/clients/pages/clients-page/clients-page.component').then(m => m.ClientsPageComponent)
  },
  {
    path: 'accounts',
    loadComponent: () => import('./features/accounts/pages/accounts-page/accounts-page.component').then(m => m.AccountsPageComponent)
  },
  {
    path: 'movements',
    loadComponent: () => import('./features/movements/pages/movements-page/movements-page.component').then(m => m.MovementsPageComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/pages/reports-page/reports-page.component').then(m => m.ReportsPageComponent)
  },
  {
    path: '**',
    redirectTo: '/clients'
  }
];


