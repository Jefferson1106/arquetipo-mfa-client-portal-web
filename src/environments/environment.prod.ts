/**
 * Configuración del entorno de producción
 * Contiene las variables de configuración para el entorno de producción
 */
export const environment = {
  production: true,
  apiUrl: '/spf-msa-client-core-service',
  appName: 'arquetipo-mfa-client-portal-web',
  version: '1.0.0',
  enableLogging: false,
  enableMockData: false,
  features: {
    enableReports: true,
    enablePdfDownload: true,
    enableAdvancedSearch: true
  }
};


