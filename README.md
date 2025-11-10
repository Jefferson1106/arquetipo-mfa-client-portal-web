# Arquetipo MFA - Client Portal Web

Proyecto frontend Angular (portal web) para el sistema bancario - arquetipo MFA.

Este repositorio contiene la aplicación cliente (Angular), utilidades de testing y archivos Docker locales.

## Contenido
- `src/` - código fuente Angular
- `angular.json`, `tsconfig*.json` - configuración de TypeScript/Angular
- `package.json` - scripts y dependencias
- `jest.config.ts`, `setup-jest.ts`, `tsconfig.jest.json` - configuración para Jest (migración opcional)
- `DOCKER-LOCAL.md`, `docker-compose.local.yml`, `docker-compose.yml` - utilidades Docker

## Requisitos
- Node.js 18+ (compatible con TypeScript/Angular de este proyecto)
- npm (o yarn)
- Angular CLI (opcional para comandos `ng` locales): `npm i -g @angular/cli`
- Para correr tests con Karma se necesita Chrome en la máquina (o bien configurar Puppeteer/ChromeHeadless en CI)

## Instalar dependencias
En Windows (cmd.exe):

```cmd
npm install
```

## Desarrollo (servidor local)
Ejecuta el servidor Angular en modo desarrollo:

```cmd
npm start
```

Esto arranca `ng serve` y la aplicación estará disponible en `http://localhost:4200` por defecto.

## Compilar para producción

```cmd
npm run build:prod
```

Los artefactos se generan en `dist/`.

## Pruebas
### Karma / Jasmine (configuración original)
- Ejecutar en modo desarrollo (usa navegador):

```cmd
npm test
```

- Ejecutar en CI (headless Chrome):

```cmd
npm run test:ci
```

Nota: en Windows puede ser necesario ajustar la política de ejecución de PowerShell o usar `cmd.exe` para ejecutar scripts.

### Jest (opcional, migración incluida)
Este repositorio incluye configuración para ejecutar los tests con Jest (más rápido, sin Chrome). Para ejecutarlos:

```cmd
npm run test:jest
```

Modo watch:

```cmd
npm run test:jest:watch
```

Si Jest indica que falta `ts-node`, instálalo como dependencia de desarrollo:

```cmd
npm install --save-dev ts-node
```

Si ves conflictos entre `@types/jest` y `@types/jasmine`, el proyecto usa una configuración separada `tsconfig.jest.json` para Jest y mantiene `tsconfig.spec.json` para Karma/Jasmine.

## Docker (local)
Revisa `DOCKER-LOCAL.md` y `docker-compose.local.yml` para instrucciones específicas del entorno local. Hay un script `docker-local.bat` en la raíz que ayuda con el arranque en Windows.

## Solución de problemas comunes
- Error de PowerShell al correr scripts: abre una terminal `cmd.exe` o ajusta la política con permisos si entiendes los riesgos:

```powershell
# Ejecutar en PowerShell como administrador (opcional y con precaución):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

- Karma no arranca porque no encuentra Chrome en CI: instale Chrome o configure `CHROME_BIN` apuntando a un binario de Chrome/Chromium, o use Puppeteer.

- Conflictos de tipos entre `@types/jest` y `@types/jasmine`: la configuración de Jest usa `tsconfig.jest.json` (usa tipos `jest`) y `tsconfig.spec.json` sigue usando `jasmine` para Karma. Si trabajas solo con Jest puedes quitar `@types/jasmine`.

- Si Jest se queja de `ts-node` al leer `jest.config.ts`, asegúrate de instalar `ts-node` en devDependencies.

## Estructura de testing añadida
Se añadieron/posicionaron archivos para migración a Jest (opcional):
- `jest.config.ts` — configuración principal de Jest + mappings de paths
- `setup-jest.ts` — inicialización de zone.js y adaptadores necesarios
- `tsconfig.jest.json` — configuración TypeScript para ejecución de tests con Jest

Estos archivos permiten ejecutar los tests en Node (sin Chrome). Si prefieres usar Karma, la configuración original sigue funcionando.

## Contribuir
- Haz fork y pull request contra `main`.
- Ejecuta `npm install` y asegúrate que las pruebas relevantes pasen antes de abrir el PR.

## Licencia
Este repositorio incluye la licencia MIT por defecto (si tu proyecto usa otra licencia, actualiza esta sección).

---

Si quieres, puedo:
- Añadir badges (build, tests, coverage) al README
- Agregar instrucciones concretas para CI (GitHub Actions) que usen Jest
- Limpiar/convertir los specs de Jasmine a Jest (refactor mínimo)

¿Qué prefieres que haga ahora?