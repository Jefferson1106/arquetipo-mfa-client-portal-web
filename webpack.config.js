const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'banking_portal',
      filename: 'remoteEntry.js',
      exposes: {
        './ClientsModule': './src/app/features/clients/pages/clients-page/clients-page.component.ts',
        './AccountsModule': './src/app/features/accounts/pages/accounts-page/accounts-page.component.ts',
        './MovementsModule': './src/app/features/movements/pages/movements-page/movements-page.component.ts',
        './ReportsModule': './src/app/features/reports/pages/reports-page/reports-page.component.ts'
      },
      shared: {
        '@angular/core': { singleton: true, strictVersion: true, requiredVersion: '^20.0.0', eager: true },
        '@angular/common': { singleton: true, strictVersion: true, requiredVersion: '^20.0.0', eager: true },
        '@angular/router': { singleton: true, strictVersion: true, requiredVersion: '^20.0.0', eager: true },
        '@angular/forms': { singleton: true, strictVersion: true, requiredVersion: '^20.0.0', eager: true },
        'rxjs': { singleton: true, eager: true }
      },
      // Desactivar generación de tipos en producción
      dts: false
    })
  ]
};